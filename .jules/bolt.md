## 2025-05-15 - [React State Isolation]
**Learning:** Top-level high-frequency state (like a clock updating every second) causes unnecessary re-renders of the entire page and all its sub-components. Isolating such state into small leaf components significantly reduces CPU usage and reconciliation overhead.
**Action:** Always look for high-frequency timers or states in large components and move them to isolated sub-components.
