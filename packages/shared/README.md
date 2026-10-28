# Shared incident rules

T1 of the Centralized Incident Manager adds standard-library Python rules alongside
the existing TypeScript types. No cross-language build or new dependency is needed.

| Module | Contract |
| --- | --- |
| `incident_validation.py` | Legacy uppercase CSV enums, column schema, safe error classes, header and record validation |
| `incidents.py` | Manager lowercase enums, four allowed lifecycle edges, nonblank text and UTC timestamp helpers |

`validate_record(record, seen_ids)` expects stripped CSV fields and returns reason
codes without mutating `seen_ids`. Callers retain responsibility for CSV parsing,
structural errors, normalization and duplicate tracking. Keep original description
text separately for historical import. Both `validate_header` and `validate_record`
accept keyword-only `allow_missing_incident_id=False`. Only the seed opts in:
it may omit the ID column or supply an empty stripped ID. Nonempty malformed IDs
remain invalid, and all other header/record rules remain enforced. Validators do
not invent identities or mutate duplicate tracking. Analyzer callers retain the
strict default, including required ID column and valid nonblank ID. Score rules
are unchanged.

`shared/incident_analysis.py` retains aggregation/export and reexports its original
constants, exceptions and private helper aliases. Existing CLI/API imports still work.
Manager Pydantic schemas live in `services/api/incident_models.py` and consume the
shared rules directly. Registration requires branch for every origin, defaults to
`open`, and accepts any valid specified status. Text must be nonblank but is not
stripped or capped at 120 characters; the 120-character title rule belongs to the
seed transformation only. Records generate UUID4 strings and aware UTC
timestamps; supplied aware dates normalize to UTC and naive dates are rejected.
Status-update payloads contain only status; future services must call
`validate_status_transition` with the stored status before mutation.

## Focused checks

Run from the repository root:

```bash
python3 -m unittest shared.test_incident_analysis shared.test_incident_contract -v
uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_models.py' -v
```

T2 storage and historical seed use these rules; see
[seed policy](../../scripts/README.md#historical-incident-manager-seed).
The five authenticated manager routes and backoffice UI are implemented. See the
[API contracts](../../services/api/README.md#incident-management-api-t3),
[UI contracts](../../uis/backoffice/README.md#incident-manager--t4-source-implementation)
and [delivery guide](../../docs/centralized-incident-manager.md) for current verification and pending review.
