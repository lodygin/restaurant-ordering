# Test assignment: Middle Angular Developer

Restaurant Ordering — a real-time web application prototype.

## 01 Context

A restaurant accepts orders through its website. Its menu, prices and item availability change in real time, and the application has to keep up.

## 02 Your Task

Build a **prototype** that consists of three parts.

### Setup: Menu configuration

- Manage categories and items.
- Configure each item's price and availability.
- Mark an item as **open-price**: its price is entered at the moment it is added to an order.
- Any change is reflected in Menu immediately.

### Menu: Ordering

- Browse a large menu.
- Add items to the cart with a quantity. For open-price items, the user also enters the price.
- Apply a fixed-amount discount to the order.
- Check out. An order must never be placed twice, and the user must be informed of any availability changes before confirming.
- View all orders on a separate page, with each order's status updating in real time.

### Server: Data and real-time updates

- A minimal server that provides the data and real-time updates the frontend needs.
- Any technology works, for example Node.js.

## 03 General Requirements

- **Speed.** The app opens quickly, runs smoothly on low-end devices and slow connections, stays visually stable while content loads and responds instantly to user input.
- **Live updates.** Menu, price and availability changes appear right away while the user is browsing.
- **Reliability.** Errors are handled gracefully: the user understands what went wrong and can carry on. Neither server errors nor a lost connection break the app.

## 04 Build Requirements

- The whole project, including the server, installs and runs with one or two commands, as described in the README.
- Build, tests and lint pass. TypeScript runs in strict mode.

## 05 Tech Stack

Angular, TypeScript, Angular Material / CDK, NgRx or NGXS, Jest, Vitest or Karma.

## 06 Deliverables

A Git repository with a meaningful commit history. Its **README.md** should cover:

- how to run the project;
- your key decisions and the trade-offs behind them;
- what you deliberately simplified;
- what would be needed to make it production-ready.

## 07 Notes

- This is a prototype, not a production application. We care about your architecture and how you use the tools, not about polish or completeness.
- Anything not specified here is your call. Just explain your choices in the README.
