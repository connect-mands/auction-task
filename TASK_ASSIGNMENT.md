🧩 Assessment Title:
“Real-Time Auction & Bidding Platform”

🧠 Project Overview:
You are required to design and implement a real-time online auction platform where multiple users can bid simultaneously on listed items. The system should support live updates, user authentication, and auction state management with a clear and responsive UI.

The application must be built using a modern full-stack architecture that demonstrates your ability to manage concurrency, scalability, and maintainability.

⚙️ Core Requirements:
Frontend
Use Next.js preferred.


Implement real-time updates for live bidding (via WebSockets, Socket.IO, or any pub/sub mechanism).


Create a dashboard displaying ongoing, upcoming, and completed auctions.


Each auction should display:


Item details (title, image, description, starting price, current highest bid, time remaining).


Real-time bid updates and user activity.


Show countdown timers for each auction that sync accurately with server time.


Provide a clean, modern, and responsive UI/UX.


Backend
Use Node.js (Express)


Implement secure user authentication (JWT or OAuth 2.0).


Maintain consistent auction state between multiple users (e.g., when a bid is placed, all connected clients should update instantly).


Implement bid validation logic:


Reject bids lower than or equal to the current highest bid.


Reject bids after auction expiration.


Maintain an audit log of all bidding activities.


Database
Use PostgreSQL.


Design a scalable schema for users, items, auctions, and bids.


Store historical bidding data for completed auctions.


Bonus (Optional but Strongly Considered)
Implement admin panel for managing auctions (create/edit/delete items).


Use Redis for caching or pub/sub message distribution.


Include unit tests or integration tests for key APIs.


Add Docker configuration for easy deployment.


Include a README.md explaining architecture, setup steps, and design choices.


🚀 Deliverables
Public GitHub repository with full source code.


Clear README with setup instructions and project explanation.

📬 Submission
Once complete, please email your project repository link (and demo link if available) to:
📧 hr@skyitsolution.co.in
with the subject line: “Full Stack Assessment – Mandeep Singh”

🧾 Evaluation Criteria
Code structure and readability


System architecture & scalability


API design and data modeling


Real-time implementation quality


UI/UX clarity and responsiveness


Documentation and test coverage