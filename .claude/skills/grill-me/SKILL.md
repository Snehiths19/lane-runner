---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

For each question, provide your recommended answer in this format:
**Recommendation:** [your answer]
**Tradeoff:** [what this approach does well] vs [what it costs or makes harder]

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

## During the session

### Sharpen fuzzy language

When I use vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things." Even without a glossary to write to, the act of agreeing on a term tightens the rest of the session.

### Discuss concrete scenarios

When relationships or boundaries are being discussed, stress-test them with specific scenarios. Invent edge cases that force me to be precise. "Okay, so what happens if the user cancels mid-flow and then retries within 30 seconds — same session or new one?"

### Surface hidden invariants

After each significant decision, ask: **"What new rule does this create, and does anything existing already violate it?"** A decision is only safe if everything downstream already respects it. If it doesn't, surface the risk before moving on.
