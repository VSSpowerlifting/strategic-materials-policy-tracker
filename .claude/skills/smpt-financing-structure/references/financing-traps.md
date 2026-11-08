# Financing traps

Each trap below occurred, or nearly occurred, in SMPT drafts. Check the draft for each; mark PASS, FIX or N/A.

| # | Trap | Correct treatment |
| --- | --- | --- |
| 1 | Headline commitment reported as funding received | Record committed, drawn and ended separately; an expired-undrawn commitment funded nothing. |
| 2 | Replacement financing added to the instrument it replaced | Link with `replaced_by`; show substitution, not a sum. |
| 3 | Gross proceeds shown as cash to the company | Show gross, discount/fees and net; use net for liquidity. |
| 4 | One-off fee compared with a fee on a different base | State both bases; do not rank unlike bases. Do not annualise a one-off fee. |
| 5 | Ownership dilution and share-count increase used interchangeably | Name the denominator (post- vs pre-offering) every time. |
| 6 | Backstop or put right counted as available cash | Conditional term only; model cash from it only in a labelled scenario. |
| 7 | Letters of credit treated as borrowings, or ignored in availability | They reduce availability; they are not drawn debt. |
| 8 | Use-of-proceeds clause paraphrased more broadly than written | Quote the section; summarise its effect narrowly. |
| 9 | Bridge components "plugged" to force a tie | Run the script; show any residual. |
| 10 | Financing timed near a policy announcement presented as caused by it | Rank competing explanations; state the judgment and its refuting evidence. |
| 11 | Private capital or total project cost presented as public support | Keep provider type explicit; public support is only what a government body provides. |
| 12 | Amounts in different currencies or roles totalled | Use `strategy_calc.py totals`; it refuses a grand total. |
| 13 | Snapshot figure given without its date | Every liquidity figure carries its as-of date. |
