# Module 3: Messaging System Implementation

**Priority**: High (Core Communication)  
**Duration**: 2-3 weeks  
**Dependencies**: Module 1 (Job Workflows)  
**Files**: ~10 new/modified

---

## Overview

Implement complete real-time messaging system with WebSocket support matching React Native mobile app. Enables communication between clients and workers throughout job lifecycle.

**RN Source Files**:

- `app/messages/index.tsx` - Conversations list
- `app/messages/[conversationId].tsx` - Chat interface
- `context/SocketContext.tsx` - WebSocket context
- `lib/hooks/useMessages.ts` - Message hooks

---

## 3.1 WebSocket Setup

### Files to Create

```
lib/socket/client.ts (NEW - 180 lines)
lib/socket/hooks.ts (NEW - 120 lines)
context/SocketContext.tsx (NEW - 150 lines)
```

### Features

#### Socket.IO Client Setup

**Socket Client Instance**:

```typescript
// lib/socket/client.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:8000",
    {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    }
  );

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitEvent = (event: string, data: any) => {
  if (!socket?.connected) {
    console.warn("Socket not connected, event not sent:", event);
    return false;
  }
  socket.emit(event, data);
  return true;
};

export const onEvent = (event: string, callback: (...args: any[]) => void) => {
  if (!socket) {
    console.warn("Socket not initialized");
    return;
  }
  socket.on(event, callback);
};

export const offEvent = (event: string) => {
  if (!socket) return;
  socket.off(event);
};
```

#### Socket Context Provider

**React Context for Socket**:

```typescript
// context/SocketContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket/client';
import { useAuth } from './AuthContext';
import type { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, token]);

  const connect = () => {
    if (!token) return;

    const socketInstance = initializeSocket(token);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });
  };

  const disconnect = () => {
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
```

#### Socket Hooks

**Reusable Socket Hooks**:

```typescript
// lib/socket/hooks.ts
import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

export const useSocketEvent = (
  event: string,
  callback: (...args: any[]) => void
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
};

export const useTypingIndicator = (conversationId: number) => {
  const { socket, isConnected } = useSocket();

  const startTyping = () => {
    if (!isConnected) return;
    socket?.emit("typing_start", { conversation_id: conversationId });
  };

  const stopTyping = () => {
    if (!isConnected) return;
    socket?.emit("typing_stop", { conversation_id: conversationId });
  };

  return { startTyping, stopTyping };
};

export const useMessageDelivery = (conversationId: number) => {
  const { socket, isConnected } = useSocket();

  const markAsDelivered = (messageId: number) => {
    if (!isConnected) return;
    socket?.emit("message_delivered", {
      conversation_id: conversationId,
      message_id: messageId,
    });
  };

  const markAsRead = (messageId: number) => {
    if (!isConnected) return;
    socket?.emit("message_read", {
      conversation_id: conversationId,
      message_id: messageId,
    });
  };

  return { markAsDelivered, markAsRead };
};
```

---

## 3.2 Conversations List (Inbox)

### Files to Create

```
app/dashboard/messages/page.tsx (NEW - 480 lines)
components/messages/ConversationCard.tsx (NEW - 220 lines)
components/messages/ConversationSkeleton.tsx (NEW - 60 lines)
lib/hooks/useConversations.ts (NEW - 150 lines)
```

### Features (CLIENT + WORKER SIDE)

#### Conversations List Page

**Layout**:

```typescript
<ConversationsPage>
  <Header>
    <Title>Messages</Title>
    <UnreadBadge count={unreadCount} />
  </Header>

  <SearchBar
    placeholder="Search conversations..."
    value={searchQuery}
    onChange={setSearchQuery}
  />

  <FilterTabs>
    <Tab active={filter === 'all'} onClick={() => setFilter('all')}>
      All ({totalCount})
    </Tab>
    <Tab active={filter === 'unread'} onClick={() => setFilter('unread')}>
      Unread ({unreadCount})
    </Tab>
    <Tab active={filter === 'active'} onClick={() => setFilter('active')}>
      Active Jobs ({activeJobsCount})
    </Tab>
  </FilterTabs>

  <ConversationsList>
    {loading ? (
      <ConversationSkeleton count={5} />
    ) : conversations.length === 0 ? (
      <EmptyState>
        <Icon>💬</Icon>
        <Text>No conversations yet</Text>
        <SubText>Start a conversation by applying to a job or hiring a worker</SubText>
      </EmptyState>
    ) : (
      conversations.map(conv => (
        <ConversationCard
          key={conv.id}
          conversation={conv}
          onClick={() => router.push(`/dashboard/messages/${conv.id}`)}
        />
      ))
    )}
  </ConversationsList>
</ConversationsPage>
```

#### Conversation Card Component

**Card Layout**:

```typescript
<ConversationCard conversation={conversation}>
  <Avatar
    src={otherUser.avatar}
    online={otherUser.isOnline}
  />

  <Content>
    <Header>
      <Name>{otherUser.name}</Name>
      <Timestamp>{formatRelativeTime(lastMessage.createdAt)}</Timestamp>
    </Header>

    <JobInfo>
      <JobTitle truncate>{job.title}</JobTitle>
      <JobStatus badge>{job.status}</JobStatus>
    </JobInfo>

    <LastMessage>
      {lastMessage.senderID === currentUserId && (
        <YouPrefix>You: </YouPrefix>
      )}
      {lastMessage.messageType === 'TEXT' ? (
        <Text truncate>{lastMessage.messageText}</Text>
      ) : (
        <MediaIcon>
          {lastMessage.messageType === 'IMAGE' && '📷 Photo'}
          {lastMessage.messageType === 'FILE' && '📎 File'}
        </MediaIcon>
      )}
    </LastMessage>
  </Content>

  {conversation.unreadCount > 0 && (
    <UnreadBadge>{conversation.unreadCount}</UnreadBadge>
  )}

  {otherUser.isTyping && (
    <TypingIndicator>
      <Dots>...</Dots>
    </TypingIndicator>
  )}
</ConversationCard>
```

#### Real-Time Updates

**Socket Events for Conversations List**:

```typescript
const ConversationsPage = () => {
  const { data: conversations, refetch } = useConversations();

  // Listen for new messages
  useSocketEvent('new_message', (data) => {
    refetch(); // Refresh list to update last message + unread count
  });

  // Listen for typing indicators
  useSocketEvent('user_typing', (data) => {
    // Update conversation with typing indicator
    setConversations(prev =>
      prev.map(conv =>
        conv.id === data.conversation_id
          ? { ...conv, otherUser: { ...conv.otherUser, isTyping: true } }
          : conv
      )
    );
  });

  useSocketEvent('user_stopped_typing', (data) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === data.conversation_id
          ? { ...conv, otherUser: { ...conv.otherUser, isTyping: false } }
          : conv
      )
    );
  });

  // Listen for online status
  useSocketEvent('user_online', (data) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.otherUser.id === data.user_id
          ? { ...conv, otherUser: { ...conv.otherUser, isOnline: true } }
          : conv
      )
    );
  });

  useSocketEvent('user_offline', (data) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.otherUser.id === data.user_id
          ? { ...conv, otherUser: { ...conv.otherUser, isOnline: false } }
          : conv
      )
    );
  });

  return (/* JSX */);
};
```

#### API Endpoints

**Get Conversations**:

```typescript
GET /api/mobile/messages/conversations?filter=all

Response:
{
  conversations: Array<{
    id: number;
    job_id: number;
    job_title: string;
    job_status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED";
    other_user: {
      id: number;
      name: string;
      avatar: string;
      is_online: boolean;
      is_typing: boolean;
    };
    last_message: {
      id: number;
      sender_id: number;
      message_type: "TEXT" | "IMAGE" | "FILE";
      message_text?: string;
      created_at: string;
    };
    unread_count: number;
    created_at: string;
  }>;
  total_count: number;
  unread_count: number;
}
```

---

## 3.3 Chat Interface

### Files to Create

```
app/dashboard/messages/[conversationId]/page.tsx (NEW - 720 lines)
components/messages/ChatHeader.tsx (NEW - 180 lines)
components/messages/MessageBubble.tsx (NEW - 200 lines)
components/messages/MessageInput.tsx (NEW - 280 lines)
components/messages/TypingIndicator.tsx (NEW - 60 lines)
lib/hooks/useMessages.ts (NEW - 200 lines)
```

### Features (CLIENT + WORKER SIDE)

#### Chat Page Layout

```typescript
<ChatPage conversationId={conversationId}>
  <ChatHeader
    conversation={conversation}
    onBackClick={() => router.push('/dashboard/messages')}
    onJobClick={() => router.push(`/dashboard/jobs/${conversation.jobId}`)}
  />

  <MessagesContainer ref={messagesContainerRef}>
    {loadingMessages ? (
      <LoadingSpinner />
    ) : (
      <>
        {hasMoreMessages && (
          <LoadMoreButton onClick={loadMoreMessages}>
            Load Earlier Messages
          </LoadMoreButton>
        )}

        <MessagesList>
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderID === currentUserId}
              showAvatar={shouldShowAvatar(messages, index)}
              showTimestamp={shouldShowTimestamp(messages, index)}
            />
          ))}
        </MessagesList>

        {otherUserTyping && <TypingIndicator name={otherUser.name} />}

        <div ref={messagesEndRef} />
      </>
    )}
  </MessagesContainer>

  <MessageInput
    conversationId={conversationId}
    onSend={handleSendMessage}
    onTyping={handleTyping}
    onStopTyping={handleStopTyping}
  />
</ChatPage>
```

#### Chat Header Component

```typescript
<ChatHeader>
  <BackButton onClick={onBackClick}>
    <Icon>←</Icon>
  </BackButton>

  <UserInfo onClick={() => router.push(`/dashboard/${userType}s/${otherUser.id}`)}>
    <Avatar
      src={otherUser.avatar}
      online={otherUser.isOnline}
    />
    <Details>
      <Name>{otherUser.name}</Name>
      {otherUser.isOnline ? (
        <Status variant="success">● Online</Status>
      ) : (
        <Status variant="muted">Last seen {formatRelativeTime(otherUser.lastSeen)}</Status>
      )}
    </Details>
  </UserInfo>

  <JobInfo onClick={onJobClick}>
    <JobTitle>{job.title}</JobTitle>
    <JobStatus badge>{job.status}</JobStatus>
  </JobInfo>

  <Actions>
    <IconButton onClick={() => setShowJobActions(true)}>
      <Icon>⋮</Icon>
    </IconButton>
  </Actions>
</ChatHeader>
```

#### Message Bubble Component

```typescript
<MessageBubble message={message} isOwn={isOwn}>
  <BubbleWrapper isOwn={isOwn}>
    {showAvatar && !isOwn && (
      <Avatar src={sender.avatar} size="sm" />
    )}

    <Bubble variant={isOwn ? 'primary' : 'secondary'}>
      {message.messageType === 'TEXT' && (
        <TextContent>{message.messageText}</TextContent>
      )}

      {message.messageType === 'IMAGE' && (
        <ImageContent>
          <Image
            src={message.imageURL}
            alt="Message image"
            onClick={() => openLightbox(message.imageURL)}
          />
        </ImageContent>
      )}

      {message.messageType === 'FILE' && (
        <FileContent>
          <FileIcon />
          <FileName>{message.fileName}</FileName>
          <DownloadButton href={message.fileURL} download>
            Download
          </DownloadButton>
        </FileContent>
      )}

      {showTimestamp && (
        <Timestamp isOwn={isOwn}>
          {formatTime(message.createdAt)}
          {isOwn && message.isRead && <Icon>✓✓</Icon>}
          {isOwn && !message.isRead && message.isDelivered && <Icon>✓</Icon>}
        </Timestamp>
      )}
    </Bubble>
  </BubbleWrapper>
</MessageBubble>
```

#### Message Input Component

```typescript
<MessageInput>
  <InputContainer>
    <AttachButton onClick={handleAttachClick}>
      <Icon>📎</Icon>
    </AttachButton>

    <TextArea
      ref={inputRef}
      value={message}
      onChange={handleMessageChange}
      onKeyPress={handleKeyPress}
      placeholder="Type a message..."
      rows={1}
      maxRows={4}
    />

    <ImageButton onClick={handleImageSelect}>
      <Icon>📷</Icon>
    </ImageButton>

    <SendButton
      onClick={handleSendMessage}
      disabled={!message.trim() && !selectedImage}
    >
      <Icon>➤</Icon>
    </SendButton>
  </InputContainer>

  {selectedImage && (
    <ImagePreview>
      <Image src={selectedImage.preview} />
      <RemoveButton onClick={() => setSelectedImage(null)}>
        <Icon>✕</Icon>
      </RemoveButton>
    </ImagePreview>
  )}

  {uploadProgress > 0 && uploadProgress < 100 && (
    <UploadProgress>
      <ProgressBar value={uploadProgress} />
      <ProgressText>{uploadProgress}%</ProgressText>
    </UploadProgress>
  )}
</MessageInput>
```

#### Real-Time Message Handling

**Sending Messages**:

```typescript
const handleSendMessage = async () => {
  if (!message.trim() && !selectedImage) return;

  const tempId = Date.now(); // Optimistic UI

  // Add message to UI immediately
  const tempMessage = {
    id: tempId,
    senderID: currentUserId,
    messageType: selectedImage ? "IMAGE" : "TEXT",
    messageText: message,
    imageURL: selectedImage?.preview,
    createdAt: new Date().toISOString(),
    isDelivered: false,
    isRead: false,
  };

  setMessages((prev) => [...prev, tempMessage]);
  setMessage("");
  setSelectedImage(null);
  stopTyping();

  try {
    let response;

    if (selectedImage) {
      // Upload image first
      const formData = new FormData();
      formData.append("image", selectedImage.file);
      formData.append("conversation_id", conversationId);

      response = await sendImageMessage(formData, (progress) => {
        setUploadProgress(progress);
      });
    } else {
      // Send text message
      response = await sendTextMessage({
        conversation_id: conversationId,
        message_text: message,
      });
    }

    // Update temp message with real data
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === tempId
          ? { ...msg, id: response.message_id, isDelivered: true }
          : msg
      )
    );

    // Emit socket event
    socket?.emit("new_message", {
      conversation_id: conversationId,
      message_id: response.message_id,
      recipient_id: otherUser.id,
    });
  } catch (error) {
    // Remove temp message on error
    setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    toast.error("Failed to send message");
  }
};
```

**Receiving Messages**:

```typescript
useSocketEvent("new_message", (data) => {
  if (data.conversation_id !== conversationId) return;

  // Add message to list
  setMessages((prev) => [...prev, data.message]);

  // Scroll to bottom
  scrollToBottom();

  // Mark as delivered
  markAsDelivered(data.message.id);

  // Mark as read if chat is active
  if (document.hasFocus()) {
    setTimeout(() => {
      markAsRead(data.message.id);
    }, 1000);
  }
});
```

**Typing Indicators**:

```typescript
const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
  setMessage(e.target.value);

  // Start typing indicator
  if (!isTyping) {
    startTyping();
    setIsTyping(true);
  }

  // Reset typing timeout
  clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => {
    stopTyping();
    setIsTyping(false);
  }, 3000);
};

useSocketEvent("user_typing", (data) => {
  if (
    data.conversation_id === conversationId &&
    data.user_id === otherUser.id
  ) {
    setOtherUserTyping(true);
  }
});

useSocketEvent("user_stopped_typing", (data) => {
  if (
    data.conversation_id === conversationId &&
    data.user_id === otherUser.id
  ) {
    setOtherUserTyping(false);
  }
});
```

#### API Endpoints

**Get Messages**:

```typescript
GET /api/mobile/messages/conversation/{conversation_id}?page=1&limit=50

Response:
{
  messages: Array<{
    id: number;
    sender_id: number;
    sender_name: string;
    sender_avatar: string;
    message_type: "TEXT" | "IMAGE" | "FILE";
    message_text?: string;
    image_url?: string;
    file_url?: string;
    file_name?: string;
    is_delivered: boolean;
    is_read: boolean;
    created_at: string;
  }>;
  has_more: boolean;
  page: number;
}
```

**Send Text Message**:

```typescript
POST / api / mobile / messages / send;
{
  conversation_id: number;
  message_text: string;
}

Response: {
  success: true;
  message_id: number;
  created_at: string;
}
```

**Send Image Message**:

```typescript
POST /api/mobile/messages/send-image
FormData {
  conversation_id: number;
  image: File;
}

Response:
{
  success: true;
  message_id: number;
  image_url: string;
  created_at: string;
}
```

**Mark as Read**:

```typescript
POST / api / mobile / messages / mark - read;
{
  conversation_id: number;
  message_id: number;
}

Response: {
  success: true;
}
```

---

## 3.4 Job Actions in Chat

### Features (CLIENT + WORKER SIDE)

#### Quick Actions Menu

**Actions displayed in chat header dropdown**:

**Client Actions**:

```typescript
<JobActionsMenu role="client">
  {job.status === 'ACTIVE' && job.jobType === 'LISTING' && (
    <Action onClick={() => router.push(`/dashboard/jobs/${job.id}/applications`)}>
      <Icon>📋</Icon>
      View Applications ({job.applicationsCount})
    </Action>
  )}

  {job.status === 'IN_PROGRESS' && !job.clientConfirmedWorkStarted && (
    <Action onClick={handleConfirmWorkStarted}>
      <Icon>✅</Icon>
      Confirm Work Started
    </Action>
  )}

  {job.workerMarkedComplete && !job.clientMarkedComplete && (
    <Action onClick={() => router.push(`/dashboard/payments/final/${job.id}`)}>
      <Icon>💰</Icon>
      Approve & Pay Final
    </Action>
  )}

  {job.status === 'COMPLETED' && !job.clientReviewed && (
    <Action onClick={() => router.push(`/dashboard/reviews/submit/${job.id}`)}>
      <Icon>⭐</Icon>
      Leave Review
    </Action>
  )}

  <Divider />

  <Action onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
    <Icon>📄</Icon>
    View Job Details
  </Action>
</JobActionsMenu>
```

**Worker Actions**:

```typescript
<JobActionsMenu role="worker">
  {job.status === 'IN_PROGRESS' && !job.workerMarkedComplete && (
    <Action onClick={() => setShowMarkCompleteModal(true)}>
      <Icon>✅</Icon>
      Mark as Complete
    </Action>
  )}

  {job.workerMarkedComplete && (
    <Alert variant="info">
      <Icon>⏳</Icon>
      Waiting for client approval
    </Alert>
  )}

  {job.status === 'COMPLETED' && !job.workerReviewed && (
    <Action onClick={() => router.push(`/dashboard/reviews/submit/${job.id}`)}>
      <Icon>⭐</Icon>
      Leave Review
    </Action>
  )}

  <Divider />

  <Action onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
    <Icon>📄</Icon>
    View Job Details
  </Action>
</JobActionsMenu>
```

#### Inline Action Messages

**System messages in chat for job events**:

```typescript
<SystemMessage type={event.type}>
  {event.type === 'JOB_STARTED' && (
    <>
      <Icon>🚀</Icon>
      <Text>Job started! Client confirmed work has begun.</Text>
    </>
  )}

  {event.type === 'WORKER_MARKED_COMPLETE' && (
    <>
      <Icon>✅</Icon>
      <Text>{worker.name} marked the job as complete.</Text>
      {isClient && (
        <ActionButton href={`/dashboard/payments/final/${job.id}`}>
          Approve & Pay
        </ActionButton>
      )}
    </>
  )}

  {event.type === 'JOB_COMPLETED' && (
    <>
      <Icon>🎉</Icon>
      <Text>Job completed! Payment released.</Text>
      {!hasReviewed && (
        <ActionButton href={`/dashboard/reviews/submit/${job.id}`}>
          Leave Review
        </ActionButton>
      )}
    </>
  )}

  {event.type === 'REVIEW_SUBMITTED' && (
    <>
      <Icon>⭐</Icon>
      <Text>{reviewer.name} left a {rating}-star review.</Text>
    </>
  )}
</SystemMessage>
```

---

## 3.5 Conversation Creation

### Features

#### Automatic Conversation Creation

**Conversations created automatically when**:

1. Client accepts worker application (LISTING job)
2. Worker accepts invite (INVITE job)
3. Either party sends first message

**Backend Logic**:

```python
def get_or_create_conversation(job_id, user1_id, user2_id):
    """
    Get existing conversation or create new one for a job.
    Only one conversation per job between two users.
    """
    conversation = Conversation.objects.filter(
        jobID=job_id,
        participants__in=[user1_id, user2_id]
    ).first()

    if not conversation:
        conversation = Conversation.objects.create(
            jobID=job_id,
        )
        conversation.participants.add(user1_id, user2_id)

        # Send welcome message
        Message.objects.create(
            conversationID=conversation,
            senderID=None,  # System message
            messageType='SYSTEM',
            messageText=f'Conversation started for "{job.title}"',
        )

    return conversation
```

**API Endpoint**:

```typescript
POST / api / mobile / messages / conversations / create;
{
  job_id: number;
  recipient_id: number;
}

Response: {
  success: true;
  conversation_id: number;
  job_title: string;
}
```

---

## 3.6 Notifications Integration

### Features

#### Push Notifications for Messages

**When to send**:

- New message received (if user not in chat)
- User mentioned in message
- Job action required (via chat actions)

**Notification Types**:

```typescript
interface MessageNotification {
  type: "NEW_MESSAGE";
  conversation_id: number;
  sender_name: string;
  sender_avatar: string;
  message_preview: string; // First 50 chars
  job_title: string;
}

interface JobActionNotification {
  type: "JOB_ACTION_REQUIRED";
  job_id: number;
  job_title: string;
  action: "CONFIRM_STARTED" | "APPROVE_COMPLETION" | "LEAVE_REVIEW";
  from_user: string;
}
```

**In-App Notification Display**:

```typescript
<NotificationToast notification={notification}>
  <Avatar src={notification.sender_avatar} />
  <Content>
    <Title>{notification.sender_name}</Title>
    <Message>{notification.message_preview}</Message>
    <JobTitle>{notification.job_title}</JobTitle>
  </Content>
  <Actions>
    <ReplyButton onClick={() => router.push(`/dashboard/messages/${notification.conversation_id}`)}>
      Reply
    </ReplyButton>
  </Actions>
</NotificationToast>
```

---

## Implementation Checklist

### Phase 1: WebSocket Setup

- [ ] Install Socket.IO client package
- [ ] Create socket client instance
- [ ] Create SocketContext provider
- [ ] Create socket hooks (useSocketEvent, useTyping)
- [ ] Add SocketProvider to app layout
- [ ] Test socket connection/disconnection
- [ ] Test reconnection logic

### Phase 2: Conversations List

- [ ] Create conversations list page
- [ ] Build ConversationCard component
- [ ] Add search functionality
- [ ] Add filter tabs (all/unread/active)
- [ ] Wire up conversations API
- [ ] Add real-time updates (new messages)
- [ ] Add typing indicators in list
- [ ] Add online status indicators
- [ ] Test empty state

### Phase 3: Chat Interface

- [ ] Create chat page
- [ ] Build ChatHeader component
- [ ] Build MessageBubble component
- [ ] Build MessageInput component
- [ ] Add auto-scroll to bottom
- [ ] Add load more messages
- [ ] Implement optimistic UI for sending
- [ ] Add typing indicator
- [ ] Add message delivery/read status
- [ ] Wire up messages API
- [ ] Test real-time message receiving

### Phase 4: Message Types

- [ ] Implement text messages
- [ ] Implement image messages with upload
- [ ] Add image lightbox viewer
- [ ] Add upload progress indicator
- [ ] Test file size validation
- [ ] Test error handling

### Phase 5: Job Actions

- [ ] Create job actions menu in chat
- [ ] Add client-specific actions
- [ ] Add worker-specific actions
- [ ] Implement inline system messages
- [ ] Wire up job action APIs
- [ ] Test action flow end-to-end

### Phase 6: Polish & Testing

- [ ] Add conversation creation logic
- [ ] Add notification integration
- [ ] Test socket reconnection
- [ ] Test multiple conversations
- [ ] Test message ordering
- [ ] Test pagination
- [ ] Performance testing with many messages
- [ ] Test on slow network

---

## Testing Strategy

### Unit Tests

- [ ] Socket connection logic
- [ ] Message formatting functions
- [ ] Timestamp display logic
- [ ] Typing indicator debounce

### Integration Tests

- [ ] Send/receive text messages
- [ ] Send/receive image messages
- [ ] Typing indicators
- [ ] Message read receipts
- [ ] Conversation creation

### E2E Tests (Playwright)

```typescript
test("Client and worker exchange messages in real-time", async ({
  browser,
}) => {
  const clientContext = await browser.newContext();
  const workerContext = await browser.newContext();

  const clientPage = await clientContext.newPage();
  const workerPage = await workerContext.newPage();

  // Client logs in and opens conversation
  await loginAsClient(clientPage);
  await clientPage.goto(`/dashboard/messages/${conversationId}`);

  // Worker logs in and opens same conversation
  await loginAsWorker(workerPage);
  await workerPage.goto(`/dashboard/messages/${conversationId}`);

  // Worker sends message
  await workerPage.fill(
    'textarea[placeholder="Type a message..."]',
    "Hello client!"
  );
  await workerPage.click('button[aria-label="Send"]');

  // Client sees message instantly
  await expect(clientPage.locator("text=Hello client!")).toBeVisible({
    timeout: 2000,
  });

  // Client sends reply
  await clientPage.fill(
    'textarea[placeholder="Type a message..."]',
    "Hi worker!"
  );
  await clientPage.click('button[aria-label="Send"]');

  // Worker sees reply
  await expect(workerPage.locator("text=Hi worker!")).toBeVisible({
    timeout: 2000,
  });

  // Test typing indicator
  await clientPage.fill(
    'textarea[placeholder="Type a message..."]',
    "Typing..."
  );
  await expect(workerPage.locator("text=typing...")).toBeVisible({
    timeout: 1000,
  });
});
```

---

## Completion Criteria

Module 3 is complete when:

- [x] WebSocket setup and connection working
- [x] Conversations list displays and updates
- [x] Chat interface functional with real-time
- [x] Text messages send/receive instantly
- [x] Image messages upload and display
- [x] Typing indicators working
- [x] Message read receipts working
- [x] Job actions integrated in chat
- [x] Notifications working for new messages
- [x] All socket events handled properly
- [x] Reconnection logic tested
- [x] 0 TypeScript errors
- [x] All E2E tests pass
- [x] Performance acceptable with 100+ messages

---

**Next Module**: Module 4 - Trust & Safety
