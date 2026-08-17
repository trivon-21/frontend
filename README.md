# AirLux Frontend

This project is the frontend client for the AirLux application, built with [Angular](https://angular.dev/). It interfaces with the AirLux backend API to provide a seamless user experience, including authentication and system maintenance features.

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Server](#development-server)
- [Building](#building)

## Features
- **User Authentication**: Secure login and signup flows.
- **Maintenance Mode**: Dynamic system maintenance detection and notification display.
- **Responsive Design**: Modern and responsive user interface components.

## Technologies
- **Angular 20**: Core framework.
- **TypeScript**: Static typing and modern language features.
- **RxJS**: Reactive programming for state management and async operations.

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Angular CLI](https://github.com/angular/angular-cli) (`npm install -g @angular/cli`)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## Development Server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project for production, run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. The production build optimizes your application for performance and speed.
