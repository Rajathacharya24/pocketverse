"""Deterministic Story Validation Engine.

This is the CORE differentiator of PocketVerse. Every check here is pure
logic — no LLM calls. The engine queries the Story Memory Graph and applies
deterministic rules to find continuity errors.

Each checker function returns a list of ValidationFindings. The master
function `validate_episode` aggregates them all.
"""

from __future__ import annotations

import logging
import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, memory_graph
from .schemas import (
    EvidenceItem,
    IssueCategory,
    IssueStatus,
    ValidationFinding,
)

logger = logging.getLogger("pocketverse.validation")


# ---------------------------------------------------------------------------
# Helper: build evidence from episode text
# ---------------------------------------------------------------------------


def _make_evidence(
    episode: models.Episode, excerpt: str, relevance: str
) -> EvidenceItem:
    """Create an EvidenceItem from an episode and excerpt."""
    return EvidenceItem(
        episode_number=episode.number,
        episode_title=episode.title,
        excerpt=excerpt,
        relevance=relevance,
    )


# ---------------------------------------------------------------------------
# Checker 1: Character Contradictions
# ---------------------------------------------------------------------------


async def check_character_contradictions(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if characters exhibit contradictory traits without a qualifying
    turning-point event between the old trait and the new one.

    Logic:
    - For each character in the new episode, compare their current traits
      against previously stored traits.
    - If a new trait contradicts an existing trait (e.g., "cowardly" vs "brave"),
      check whether a qualifying turning-point event exists between the
      episodes where each trait was established.
    - If no turning point exists → flag as contradiction.
    """
    findings: list[ValidationFinding] = []

    # Contradiction pairs — traits that conflict unless a turning point justifies it
    _CONTRADICTION_PAIRS = {
        frozenset({"brave", "cowardly"}),
        frozenset({"loyal", "treacherous"}),
        frozenset({"honest", "deceptive"}),
        frozenset({"kind", "cruel"}),
        frozenset({"trusting", "suspicious"}),
        frozenset({"generous", "greedy"}),
        frozenset({"calm", "volatile"}),
        frozenset({"confident", "insecure"}),
        frozenset({"merciful", "ruthless"}),
        frozenset({"peaceful", "aggressive"}),
        frozenset({"selfless", "selfish"}),
        frozenset({"optimistic", "pessimistic"}),
        frozenset({"forgiving", "vengeful"}),
        frozenset({"compassionate", "callous"}),
        frozenset({"humble", "arrogant"}),
    }

    # Get all characters
    characters = await memory_graph.get_all_characters(db)

    for char in characters:
        if not char.traits or len(char.traits) < 2:
            continue

        traits_lower = [t.lower().strip() for t in char.traits]

        # Check for contradictions within the character's trait list
        for pair in _CONTRADICTION_PAIRS:
            pair_list = list(pair)
            if pair_list[0] in traits_lower and pair_list[1] in traits_lower:
                # Check for a turning point that could justify the change
                events = await memory_graph.get_all_timeline_events(db)
                char_events = [
                    e
                    for e in events
                    if char.id in (e.characters_involved or [])
                    and e.turning_point_type is not None
                ]

                # Qualifying turning points for trait changes
                qualifying_types = {
                    "MOTIVATION_SHIFT",
                    "TRAUMA",
                    "REDEMPTION",
                    "REVELATION",
                    "FEAR_OVERCOME",
                    "BETRAYAL",
                }
                has_qualifying = any(
                    e.turning_point_type in qualifying_types for e in char_events
                )

                if not has_qualifying:
                    findings.append(
                        ValidationFinding(
                            category=IssueCategory.CHARACTER_CONTRADICTION,
                            status=IssueStatus.CRITICAL,
                            summary=(
                                f"Character '{char.name}' has contradictory traits "
                                f"'{pair_list[0]}' and '{pair_list[1]}' with no "
                                f"qualifying turning-point event to justify the change."
                            ),
                            evidence=[
                                _make_evidence(
                                    episode,
                                    f"Character traits: {', '.join(char.traits)}",
                                    f"'{char.name}' exhibits conflicting traits without "
                                    f"an in-story event justifying the personality shift.",
                                )
                            ],
                            details={
                                "character_name": char.name,
                                "trait_a": pair_list[0],
                                "trait_b": pair_list[1],
                                "missing": "qualifying turning-point event",
                            },
                        )
                    )

    return findings


# ---------------------------------------------------------------------------
# Checker 2: Timeline Breaks
# ---------------------------------------------------------------------------


async def check_timeline_breaks(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check for temporal inconsistencies in the timeline.

    Logic:
    - Events should have monotonically increasing sequence orders within
      an episode.
    - Cross-episode: a later episode's events should have higher sequence
      orders than earlier episodes' events.
    """
    findings: list[ValidationFinding] = []

    all_events = await memory_graph.get_all_timeline_events(db)

    if len(all_events) < 2:
        return findings

    # Check for duplicate sequence orders
    seq_orders = {}
    for evt in all_events:
        if evt.sequence_order in seq_orders:
            other = seq_orders[evt.sequence_order]
            if other.episode_id != evt.episode_id:
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.TIMELINE_BREAK,
                        status=IssueStatus.NEEDS_REVIEW,
                        summary=(
                            f"Timeline events have conflicting sequence positions: "
                            f"'{evt.event_description[:60]}...' and "
                            f"'{other.event_description[:60]}...' share sequence "
                            f"order {evt.sequence_order} across different episodes."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                "This event has the same sequence position as an event in another episode.",
                            )
                        ],
                        details={
                            "event_a": evt.event_description,
                            "event_b": other.event_description,
                            "shared_sequence": evt.sequence_order,
                        },
                    )
                )
            seq_orders[evt.sequence_order] = evt
        else:
            seq_orders[evt.sequence_order] = evt

    # Check that later episodes don't have events with lower sequence orders
    # than earlier episodes (cross-episode temporal consistency)
    episode_max_seq: dict[int, int] = {}
    for evt in all_events:
        ep_id = evt.episode_id
        if ep_id not in episode_max_seq:
            episode_max_seq[ep_id] = evt.sequence_order
        else:
            episode_max_seq[ep_id] = max(episode_max_seq[ep_id], evt.sequence_order)

    # Get episodes to compare numbers
    episodes = await memory_graph.get_all_episodes(db)
    ep_num_map = {e.id: e.number for e in episodes}

    ep_ids_sorted = sorted(episode_max_seq.keys(), key=lambda x: ep_num_map.get(x, 0))

    for i in range(1, len(ep_ids_sorted)):
        prev_ep = ep_ids_sorted[i - 1]
        curr_ep = ep_ids_sorted[i]
        prev_max = episode_max_seq[prev_ep]
        # Check if current episode has events with sequence order <= previous max
        curr_events = [e for e in all_events if e.episode_id == curr_ep]
        for evt in curr_events:
            if evt.sequence_order <= prev_max and prev_ep != curr_ep:
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.TIMELINE_BREAK,
                        status=IssueStatus.STRONG,
                        summary=(
                            f"Event '{evt.event_description[:60]}...' in episode "
                            f"{ep_num_map.get(curr_ep, '?')} has sequence order "
                            f"{evt.sequence_order}, which is not after the latest "
                            f"event in episode {ep_num_map.get(prev_ep, '?')} "
                            f"(sequence {prev_max})."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                "This event appears to occur before events in a previous episode.",
                            )
                        ],
                        details={
                            "event": evt.event_description,
                            "event_sequence": evt.sequence_order,
                            "previous_episode_max_sequence": prev_max,
                        },
                    )
                )
                break  # One finding per episode pair is enough

    return findings


# ---------------------------------------------------------------------------
# Checker 3: Broken Promises
# ---------------------------------------------------------------------------


async def check_broken_promises(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check for unfulfilled narrative promises.

    Logic:
    - If a promise has been pending for more than 3 episodes, flag it.
    - If a new event directly contradicts a promise, flag it as critical.
    """
    findings: list[ValidationFinding] = []

    unfulfilled = await memory_graph.get_unfulfilled_promises(db)
    episodes = await memory_graph.get_all_episodes(db)
    ep_id_to_num = {e.id: e.number for e in episodes}

    for promise in unfulfilled:
        made_num = ep_id_to_num.get(promise.made_episode, 0)
        gap = episode.number - made_num

        if gap >= 5:
            status = IssueStatus.CRITICAL
        elif gap >= 3:
            status = IssueStatus.NEEDS_REVIEW
        else:
            continue  # Too early to flag

        findings.append(
            ValidationFinding(
                category=IssueCategory.BROKEN_PROMISE,
                status=status,
                summary=(
                    f"Narrative promise '{promise.description[:80]}...' made in "
                    f"episode {made_num} remains unfulfilled after {gap} episodes."
                ),
                evidence=[
                    _make_evidence(
                        episode,
                        promise.description,
                        f"This promise was set up {gap} episodes ago and has not been addressed.",
                    )
                ],
                details={
                    "promise_description": promise.description,
                    "made_episode": made_num,
                    "episodes_pending": gap,
                },
            )
        )

    return findings


# ---------------------------------------------------------------------------
# Checker 4: World Rule Violations
# ---------------------------------------------------------------------------


async def check_world_rule_violations(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if new events violate established world rules.

    Logic:
    - For each new event, check if it conflicts with any established rule.
    - This uses simple keyword matching as a heuristic — a more sophisticated
      approach would use semantic similarity, but for MVP this catches
      obvious violations.
    """
    findings: list[ValidationFinding] = []

    rules = await memory_graph.get_all_world_rules(db)

    if not rules or not new_events:
        return findings

    # Build a simple keyword index from rules
    for rule in rules:
        rule_words = set(rule.rule.lower().split())
        # Remove very common words
        rule_words -= {
            "the",
            "a",
            "an",
            "is",
            "are",
            "was",
            "were",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "and",
            "or",
            "but",
            "not",
            "can",
            "cannot",
            "no",
            "only",
        }

        for evt in new_events:
            evt_words = set(evt.event_description.lower().split())
            overlap = rule_words & evt_words

            # Check for negation patterns — if the rule says "cannot" and the
            # event describes that action happening
            rule_lower = rule.rule.lower()
            evt_lower = evt.event_description.lower()

            violation = False
            if "cannot" in rule_lower or "never" in rule_lower or "impossible" in rule_lower:
                # Extract the action that's forbidden
                for neg_word in ["cannot", "never", "impossible to"]:
                    if neg_word in rule_lower:
                        # Get words after the negation
                        after_neg = rule_lower.split(neg_word, 1)[1].strip()
                        action_words = set(after_neg.split()[:5])
                        action_words -= {
                            "the", "a", "an", "be", "is", "are", "to",
                        }
                        if action_words & evt_words and len(action_words & evt_words) >= 2:
                            violation = True
                            break

            if violation:
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.WORLD_RULE_VIOLATION,
                        status=IssueStatus.CRITICAL,
                        summary=(
                            f"Event '{evt.event_description[:60]}...' may violate "
                            f"world rule: '{rule.rule[:80]}...'"
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                f"This event appears to contradict the established "
                                f"world rule: {rule.rule}",
                            )
                        ],
                        details={
                            "rule": rule.rule,
                            "rule_category": rule.category,
                            "event": evt.event_description,
                            "overlap_words": list(overlap),
                        },
                    )
                )

    return findings


# ---------------------------------------------------------------------------
# Checker 5: Relationship Inconsistencies
# ---------------------------------------------------------------------------


async def check_relationship_inconsistencies(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if relationship states changed without a qualifying event.

    Logic:
    - If two characters' relationship type changed (e.g., allies → enemies),
      check whether a qualifying turning-point event exists between them
      (BETRAYAL, ALLIANCE_BROKEN, ALLIANCE_FORMED, etc.).
    """
    findings: list[ValidationFinding] = []

    relationships = await memory_graph.get_all_relationships(db)

    # Group relationships by character pair
    pair_rels: dict[frozenset, list[models.Relationship]] = {}
    for rel in relationships:
        pair = frozenset({rel.character_a_id, rel.character_b_id})
        pair_rels.setdefault(pair, []).append(rel)

    # Contradictory relationship types
    _CONTRADICTIONS = {
        frozenset({"allies", "enemies"}),
        frozenset({"friends", "enemies"}),
        frozenset({"lovers", "enemies"}),
        frozenset({"mentor", "rival"}),
        frozenset({"trusted", "betrayed"}),
    }

    for pair, rels in pair_rels.items():
        if len(rels) < 2:
            continue

        rel_types = {r.type.lower().strip() for r in rels}

        for contradiction in _CONTRADICTIONS:
            if contradiction.issubset(rel_types):
                # Check for qualifying events
                pair_list = list(pair)
                events = await memory_graph.get_all_timeline_events(db)
                qualifying_types = {
                    "BETRAYAL",
                    "ALLIANCE_FORMED",
                    "ALLIANCE_BROKEN",
                    "REVELATION",
                    "SECRET_REVEALED",
                }
                qualifying = [
                    e
                    for e in events
                    if e.turning_point_type in qualifying_types
                    and set(pair_list).issubset(set(e.characters_involved or []))
                ]

                if not qualifying:
                    # Get character names
                    chars = await memory_graph.get_all_characters(db)
                    char_map = {c.id: c.name for c in chars}
                    names = [char_map.get(cid, "Unknown") for cid in pair_list]

                    findings.append(
                        ValidationFinding(
                            category=IssueCategory.RELATIONSHIP_INCONSISTENCY,
                            status=IssueStatus.STRONG,
                            summary=(
                                f"Relationship between {names[0]} and {names[1]} "
                                f"shows contradictory states ({', '.join(contradiction)}) "
                                f"without a qualifying turning-point event."
                            ),
                            evidence=[
                                _make_evidence(
                                    episode,
                                    f"Relationship types: {', '.join(rel_types)}",
                                    f"The relationship changed without an in-story "
                                    f"event justifying the shift.",
                                )
                            ],
                            details={
                                "characters": names,
                                "contradictory_types": list(contradiction),
                                "all_types": list(rel_types),
                            },
                        )
                    )

    return findings


# ---------------------------------------------------------------------------
# Checker 6: Dead Character Activity
# ---------------------------------------------------------------------------


async def check_dead_character_activity(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if a dead character is erroneously active in the current episode.

    Logic:
    - Find death events in previous episodes.
    - Identify which character died by name matching in description.
    - If they are involved in new events in this episode, flag it.
    """
    findings: list[ValidationFinding] = []

    # Get all characters to map ID -> name
    characters = await memory_graph.get_all_characters(db)
    char_map = {c.id: c for c in characters}

    all_events = await memory_graph.get_all_timeline_events(db)
    
    dead_char_ids = set()
    death_event_info = {}

    for evt in all_events:
        if evt.episode_id != episode.id and evt.turning_point_type == "DEATH":
            for cid in (evt.characters_involved or []):
                char = char_map.get(cid)
                if char and char.name.lower() in evt.event_description.lower():
                    dead_char_ids.add(cid)
                    death_event_info[cid] = evt

    # Check if any dead character is involved in new events in the current episode
    for evt in new_events:
        for cid in (evt.characters_involved or []):
            if cid in dead_char_ids:
                char = char_map.get(cid)
                death_evt = death_event_info[cid]
                death_ep_num = "unknown"
                death_ep = await memory_graph.get_episode(db, death_evt.episode_id)
                if death_ep:
                    death_ep_num = death_ep.number

                findings.append(
                    ValidationFinding(
                        category=IssueCategory.CHARACTER_CONTRADICTION,
                        status=IssueStatus.CRITICAL,
                        summary=(
                            f"Character '{char.name}' is active in Episode {episode.number} "
                            f"but was reported dead in Episode {death_ep_num}."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                evt.event_description,
                                f"'{char.name}' participates in this event despite being dead.",
                            )
                        ],
                        details={
                            "character_name": char.name,
                            "death_episode": death_ep_num,
                            "death_event": death_evt.event_description,
                            "current_event": evt.event_description,
                        },
                    )
                )

    return findings


# ---------------------------------------------------------------------------
# Checker 7: Secret Leaks
# ---------------------------------------------------------------------------


def _is_secret_referenced(secret_desc: str, event_desc: str) -> bool:
    """Helper to detect if a secret's core message is mentioned in an event description."""
    stop_words = {
        "the", "a", "an", "and", "or", "but", "if", "then", "else", "of", "at", 
        "by", "for", "with", "about", "to", "in", "on", "into", "has", "had", 
        "have", "is", "was", "were", "been", "who", "whom", "whose", "which", 
        "that", "this", "those", "these", "his", "her", "their", "its", "him", 
        "them", "she", "he", "they", "it", "my", "your", "our", "me", "us", "you"
    }
    words_secret = {w.strip(".,;:?!'\"()").lower() for w in secret_desc.split()} - stop_words
    words_event = {w.strip(".,;:?!'\"()").lower() for w in event_desc.split()} - stop_words
    
    overlap = words_secret.intersection(words_event)
    required_overlap = min(3, len(words_secret))
    return len(overlap) >= required_overlap


async def check_secret_leaks(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check if a secret not yet revealed is referenced or known by others.

    Logic:
    - If a secret is unrevealed in this episode:
      - Check if any new timeline event in this episode references the secret.
      - If the event involves characters other than the holder, flag it.
    """
    findings: list[ValidationFinding] = []

    characters = await memory_graph.get_all_characters(db)
    char_map = {c.id: c.name for c in characters}

    secrets = await memory_graph.get_all_secrets(db)

    for secret in secrets:
        is_unrevealed = not secret.revealed
        if secret.revealed and secret.revealed_episode is not None:
            reveal_ep = await memory_graph.get_episode(db, secret.revealed_episode)
            if reveal_ep and episode.number < reveal_ep.number:
                is_unrevealed = True

        if not is_unrevealed:
            continue

        holder_name = char_map.get(secret.holder_character_id, "Unknown")

        for evt in new_events:
            if _is_secret_referenced(secret.description, evt.event_description):
                others_involved = [
                    char_map.get(cid, "Unknown")
                    for cid in (evt.characters_involved or [])
                    if cid != secret.holder_character_id
                ]

                if others_involved:
                    findings.append(
                        ValidationFinding(
                            category=IssueCategory.RELATIONSHIP_INCONSISTENCY,
                            status=IssueStatus.STRONG,
                            summary=(
                                f"Secret leak detected: '{evt.event_description[:60]}...' "
                                f"references secret '{secret.description[:40]}...' owned by {holder_name}, "
                                f"involving other characters ({', '.join(others_involved)}) before it is revealed."
                            ),
                            evidence=[
                                _make_evidence(
                                    episode,
                                    evt.event_description,
                                    f"This event references the secret held by {holder_name} and involves {', '.join(others_involved)}.",
                                )
                            ],
                            details={
                                "secret_description": secret.description,
                                "holder_name": holder_name,
                                "other_characters": others_involved,
                                "event_description": evt.event_description,
                            },
                        )
                    )

    return findings


# ---------------------------------------------------------------------------
# Checker 8: Chronological Time & Age Inconsistencies
# ---------------------------------------------------------------------------


def _extract_age(event_desc: str, character_name: str) -> int | None:
    """Extract age of a character from event description using regex patterns."""
    escaped_name = re.escape(character_name)
    patterns = [
        rf"{escaped_name}\s+(?:is|was|aged|age)\s+(\d+)",
        rf"{escaped_name},\s*(\d+)\b",
        rf"\b(\d+)-year-old\s+{escaped_name}",
    ]
    for pattern in patterns:
        match = re.search(pattern, event_desc, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def _extract_time_jump(event_desc: str) -> int | None:
    """Extract time jump years from event description."""
    patterns = [
        rf"\b(\d+)\s+years?\s+(?:later|pass|passed|elapsed)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, event_desc, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


async def check_age_and_time_inconsistencies(
    db: AsyncSession,
    episode: models.Episode,
    new_events: list[models.TimelineEvent],
) -> list[ValidationFinding]:
    """Check for character age contradictions or timeline time-gap issues.

    Logic:
    - Trace timeline to extract time jumps and track character age mentions.
    - If a character's age decreases, or increases significantly without a time jump, flag it.
    """
    findings: list[ValidationFinding] = []

    characters = await memory_graph.get_all_characters(db)
    char_map = {c.id: c.name for c in characters}

    all_events = await memory_graph.get_all_timeline_events(db)
    all_events_sorted = sorted(all_events, key=lambda x: x.sequence_order)

    cumulative_time_jump = {}
    current_time_offset = 0
    for evt in all_events_sorted:
        jump = _extract_time_jump(evt.event_description)
        if jump:
            current_time_offset += jump
        cumulative_time_jump[evt.sequence_order] = current_time_offset

    age_mentions = []
    for evt in all_events_sorted:
        for cid in (evt.characters_involved or []):
            char_name = char_map.get(cid)
            if not char_name:
                continue
            age = _extract_age(evt.event_description, char_name)
            if age is not None:
                age_mentions.append({
                    "char_id": cid,
                    "char_name": char_name,
                    "age": age,
                    "seq_order": evt.sequence_order,
                    "episode_id": evt.episode_id,
                    "event_desc": evt.event_description
                })

    char_age_history = {}
    for mention in age_mentions:
        char_age_history.setdefault(mention["char_id"], []).append(mention)

    current_mentions = [m for m in age_mentions if m["episode_id"] == episode.id]

    for curr in current_mentions:
        cid = curr["char_id"]
        history = char_age_history[cid]
        for prev in history:
            if prev["seq_order"] >= curr["seq_order"]:
                continue
            
            time_jump = cumulative_time_jump[curr["seq_order"]] - cumulative_time_jump[prev["seq_order"]]
            age_diff = curr["age"] - prev["age"]

            if age_diff < 0:
                prev_ep = await memory_graph.get_episode(db, prev["episode_id"])
                prev_ep_num = prev_ep.number if prev_ep else "unknown"
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.TIMELINE_BREAK,
                        status=IssueStatus.CRITICAL,
                        summary=(
                            f"Character '{curr['char_name']}' aged backwards: "
                            f"{prev['age']} in Episode {prev_ep_num} to {curr['age']} in Episode {episode.number}."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                curr["event_desc"],
                                f"'{curr['char_name']}' is stated to be {curr['age']} years old here.",
                            )
                        ],
                        details={
                            "character_name": curr["char_name"],
                            "previous_age": prev["age"],
                            "previous_episode": prev_ep_num,
                            "current_age": curr["age"],
                            "current_episode": episode.number,
                        },
                    )
                )
            elif age_diff > time_jump + 1:
                prev_ep = await memory_graph.get_episode(db, prev["episode_id"])
                prev_ep_num = prev_ep.number if prev_ep else "unknown"
                findings.append(
                    ValidationFinding(
                        category=IssueCategory.TIMELINE_BREAK,
                        status=IssueStatus.STRONG,
                        summary=(
                            f"Age inconsistency for '{curr['char_name']}': "
                            f"aged from {prev['age']} (Episode {prev_ep_num}) to {curr['age']} (Episode {episode.number}) "
                            f"but only {time_jump} years elapsed in the timeline."
                        ),
                        evidence=[
                            _make_evidence(
                                episode,
                                curr["event_desc"],
                                f"'{curr['char_name']}' is stated to be {curr['age']} years old here.",
                            )
                        ],
                        details={
                            "character_name": curr["char_name"],
                            "previous_age": prev["age"],
                            "previous_episode": prev_ep_num,
                            "current_age": curr["age"],
                            "current_episode": episode.number,
                            "time_elapsed_years": time_jump,
                        },
                    )
                )

    return findings


# ---------------------------------------------------------------------------
# Master validation function
# ---------------------------------------------------------------------------


async def validate_episode(
    db: AsyncSession,
    episode_id: int,
) -> list[ValidationFinding]:
    """Run all validation checks for a given episode.

    This is the main entry point for the validation engine. It runs all
    deterministic checkers and aggregates their findings.

    Args:
        db: Database session.
        episode_id: ID of the episode to validate.

    Returns:
        List of ValidationFindings (raw, before LLM explanation).
    """
    episode = await memory_graph.get_episode(db, episode_id)
    if episode is None:
        logger.warning("Episode %d not found for validation", episode_id)
        return []

    # Get new events for this episode
    result = await db.execute(
        select(models.TimelineEvent).where(
            models.TimelineEvent.episode_id == episode_id
        )
    )
    new_events = list(result.scalars().all())

    # Run all checkers
    all_findings: list[ValidationFinding] = []

    checkers = [
        check_character_contradictions,
        check_timeline_breaks,
        check_broken_promises,
        check_world_rule_violations,
        check_relationship_inconsistencies,
        check_dead_character_activity,
        check_secret_leaks,
        check_age_and_time_inconsistencies,
    ]

    for checker in checkers:
        try:
            findings = await checker(db, episode, new_events)
            all_findings.extend(findings)
        except Exception as e:
            logger.error("Checker %s failed: %s", checker.__name__, e)

    logger.info(
        "Validation of episode %d found %d issues",
        episode_id,
        len(all_findings),
    )

    return all_findings
