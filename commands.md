# Rental Platform - Useful Commands

This file contains the common commands you need to run the project, and how to fix the common "port already in use" error.

## 1. Starting the Frontend (Next.js)

To start the frontend, open a terminal and run:
```bash
cd frontend
npm run dev
```
This will start the frontend on **http://localhost:3000**.

## 2. Starting the Backend (FastAPI/Python)

To start the backend, open a separate terminal and run:
```bash
cd backend
source venv/bin/activate  # If using a virtual environment
uvicorn app.main:app --reload
```
This will start the backend on **http://localhost:8000**.

## 3. Fixing the "Address already in use" Error

If you see an error like `Error: listen EADDRINUSE: address already in use :::3000` or the backend says `[Errno 98] Address already in use`, it means **your previous server didn't shut down properly and is still holding onto that port.**

Here are the commands to kill the process on a specific port:

### To kill the Frontend (Port 3000):
```bash
npx kill-port 3000
# or
fuser -k 3000/tcp
```

### To kill the Backend (Port 8000):
```bash
fuser -k 8000/tcp
```

Once you run these commands, the port will be freed up, and you can restart your servers using the commands in sections 1 and 2!
