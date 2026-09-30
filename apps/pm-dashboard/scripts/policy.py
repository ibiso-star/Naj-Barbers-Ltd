"""Stable control policy used by the charter checker.

IDs are part of the standards contract. If the underlying requirement changes,
review this policy and its human explanation in templates/risk-policy.md.
"""

# These are release-integrity claims, applicable to every project. They need
# verification and evidence; neither risk acceptance nor N/A clears them.
NEVER_EXCEPTION = frozenset({"SEC-018", "PROD-021", "PROD-022"})

# These controls are mandatory when the named capability exists. A project
# without that capability may use a specific N/A exception; it cannot accept
# the risk of leaving the control undone when the capability is present.
N_A_ONLY = frozenset({
    "SEC-001", "SEC-003", "SEC-004", "SEC-013", "SEC-014",
    "SEC-016", "SEC-020", "SEC-027",
})

# An actual risk acceptance in these areas also needs a separate named
# reviewer. An N/A decision is approved by the accountable release owner.
SPECIALIST_PREFIXES = frozenset({"SEC", "IR", "LEGAL", "MOB"})

# These require a hosted URL. A first-deployment check may defer them only
# with a separate, dated owner approval record.
FIRST_DEPLOY_DEFERRED = frozenset({"SEC-027", "OPS-002"})
