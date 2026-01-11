# WebSocket Job Status Updates Implementation

## Overview

Real-time job status updates have been implemented using Django Channels WebSockets. When a worker marks a job as complete or a client approves completion, all connected users (client and worker) will receive instant updates without needing to refresh the page.

---

## Backend Implementation ✅ COMPLETE

### 1. New WebSocket Consumer (`profiles/consumers.py`)

Added `JobStatusConsumer` class that:

- Accepts WebSocket connections at `ws/job/{job_id}/`
- Verifies user has access to the job (must be client or assigned worker)
- Broadcasts job status updates to all connected users

### 2. WebSocket Routing (`profiles/routing.py`)

Added route:

```python
re_path(r'ws/job/(?P<job_id>\d+)/$', consumers.JobStatusConsumer.as_asgi())
```

### 3. Broadcasting Function (`jobs/api.py`)

Added `broadcast_job_status_update()` helper function that sends updates via WebSocket channel layer.

### 4. Integration Points

**Worker marks job complete** (`/api/jobs/{job_id}/mark-complete`):

- Broadcasts: `worker_marked_complete` event
- Data includes: `worker_marked_complete`, `awaiting_client_verification`

**Client approves completion** (`/api/jobs/{job_id}/approve-completion`):

- Broadcasts: `client_approved_completion` event
- Data includes: `client_marked_complete`, `payment_method`

---

## Frontend Implementation (TODO)

### 1. Connect to Job Status WebSocket

When viewing a job (especially in job details modal), connect to the WebSocket:

```typescript
// In myRequests/page.tsx or job details component

const [jobSocket, setJobSocket] = useState<WebSocket | null>(null);

useEffect(() => {
  if (!selectedJob) return;

  // WebSocket URL (adjust based on environment)
  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/job/${selectedJob.id}/`;

  console.log("🔌 Connecting to job WebSocket:", wsUrl);
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("✅ Connected to job status WebSocket");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("📨 Job status update received:", data);

    if (data.type === "job_status_update") {
      handleJobStatusUpdate(data.data);
    }
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("🔌 Disconnected from job WebSocket");
  };

  setJobSocket(socket);

  // Cleanup on unmount
  return () => {
    socket.close();
  };
}, [selectedJob?.id]);
```

### 2. Handle Job Status Updates

```typescript
const handleJobStatusUpdate = (data: any) => {
  console.log("🔄 Handling job status update:", data);

  switch (data.event) {
    case "worker_marked_complete":
      // Worker marked job as complete
      // Update UI to show "Awaiting your approval" for client
      // Or "Waiting for client approval" for worker
      setSelectedJob((prev) => ({
        ...prev,
        workerMarkedComplete: true,
        clientMarkedComplete: false,
      }));

      // Show notification
      if (isClient) {
        alert(
          "Worker has marked this job as complete. Please review and approve!"
        );
      }
      break;

    case "client_approved_completion":
      // Client approved completion
      // Update UI to show completion approved
      setSelectedJob((prev) => ({
        ...prev,
        workerMarkedComplete: true,
        clientMarkedComplete: true,
        finalPaymentMethod: data.payment_method,
      }));

      // Show notification
      alert(
        "Job completion approved! " +
          (data.payment_method === "CASH"
            ? "Please upload proof of payment."
            : "Redirecting to payment...")
      );
      break;
  }

  // Refresh job list to update status across the app
  fetchJobRequests(); // or whatever your refresh function is called
};
```

### 3. Update UI Based on Status

In your job details modal, show different UI based on completion status:

```tsx
{
  /* Worker's View */
}
{
  isWorker && (
    <>
      {!selectedJob.workerMarkedComplete && (
        <button onClick={() => markJobComplete(selectedJob.id)}>
          Mark as Complete
        </button>
      )}

      {selectedJob.workerMarkedComplete &&
        !selectedJob.clientMarkedComplete && (
          <div className="bg-yellow-100 p-4 rounded">
            ⏳ Waiting for client to approve completion
          </div>
        )}

      {selectedJob.workerMarkedComplete && selectedJob.clientMarkedComplete && (
        <div className="bg-green-100 p-4 rounded">
          ✅ Job completed! Client has approved.
        </div>
      )}
    </>
  );
}

{
  /* Client's View */
}
{
  isClient && (
    <>
      {selectedJob.workerMarkedComplete &&
        !selectedJob.clientMarkedComplete && (
          <div className="bg-blue-100 p-4 rounded">
            <p>Worker has marked this job as complete.</p>
            <button onClick={() => approveCompletion(selectedJob.id)}>
              Approve & Pay
            </button>
          </div>
        )}

      {selectedJob.clientMarkedComplete && (
        <div className="bg-green-100 p-4 rounded">
          ✅ You have approved this job completion
        </div>
      )}
    </>
  );
}
```

---

## WebSocket Message Format

### Outgoing (Backend → Frontend)

```json
{
  "type": "job_status_update",
  "data": {
    "event": "worker_marked_complete" | "client_approved_completion",
    "job_id": 123,
    "worker_marked_complete": true,
    "client_marked_complete": false,
    "awaiting_client_verification": true,
    "payment_method": "GCASH" | "CASH" | null,
    "timestamp": "2025-11-06T12:34:56.789Z"
  }
}
```

---

## Testing

1. **Open two browsers** (or incognito + normal):
   - Browser 1: Login as client, open job details
   - Browser 2: Login as worker, open same job

2. **Worker marks complete**:
   - In Browser 2, click "Mark as Complete"
   - Browser 1 should instantly show "Worker marked complete - please approve"
   - No page refresh needed!

3. **Client approves**:
   - In Browser 1, click "Approve"
   - Browser 2 should instantly update to show "Client approved"

---

## Environment Variables

Make sure `.env.docker` has:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:8001
```

For production, use:

```bash
NEXT_PUBLIC_WS_URL=wss://your-domain.com
```

---

## Benefits

✅ **Real-time updates** - No polling or refresh needed
✅ **Better UX** - Users see changes instantly
✅ **Reduced server load** - No repeated API calls
✅ **Synchronized state** - Client and worker see same status
✅ **Scalable** - Django Channels handles multiple connections efficiently

---

## Next Steps

1. ✅ Backend WebSocket consumer created
2. ✅ WebSocket routing configured
3. ✅ Broadcasting integrated in API endpoints
4. ⏳ Frontend WebSocket connection (add to job details component)
5. ⏳ UI updates based on WebSocket messages
6. ⏳ Testing with multiple users

---

## Restart Backend

After these changes, restart the backend:

```powershell
docker-compose -f docker-compose.dev.yml restart backend
```

The WebSocket server is now ready to accept connections!
