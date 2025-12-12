import { invoke } from "@tauri-apps/api/core";

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_username: string;
  receiver_username: string;
  title: string;
  message_content: string;
  send_date: string; // Assuming NaiveDate is serialized to YYYY-MM-DD string or null
  read_status: 0 | 1;
}

export interface MarkReadPayload {
  message_id: number;
}

// Add these new interfaces and functions:
export interface SendMessagePayload {
  sender_id: number;
  receiver_id: number;
  title: string;
  message_content: string;
}

export interface CustomerSendMessagePayload {
  sender_id: number;
  title?: string; // Matching backend's Option<String>
  message_content: string;
}

export const fetchReceivedMessages = async (userId: number): Promise<Message[]> => {
  try {
    const messages = await invoke<Message[]>("get_recived_messages", { userId });
    return messages;
  } catch (error) {
    console.error("Failed to fetch received messages:", error);
    throw error;
  }
};

export const fetchSentMessages = async (userId: number): Promise<Message[]> => {
  try {
    const messages = await invoke<Message[]>("get_sent_messages", { userId });
    return messages;
  } catch (error) {
    console.error("Failed to fetch sent messages:", error);
    throw error;
  }
};

/**
 * Marks a message as read by the current user.
 * @param messageId The ID of the message to mark as read.
 * @param currentUserId The ID of the user performing the action (should be the receiver).
 * @returns A promise that resolves to a number:
 *          0: Successfully marked as read (or was already read by this user).
 *          1: Current user is not the receiver of the message.
 *          Rejects with an error message for other failures (e.g., message not found, DB error).
 */
export const markMessageAsReadApi = async (messageId: number, currentUserId: number): Promise<number> => {
  try {
    // The Rust command `mark_message_as_read` expects `data` (MarkReadData) and `current_user_id`.
    const payload: MarkReadPayload = { message_id: messageId };
    const result = await invoke<number>("mark_message_as_read", {
      data: payload,
      currentUserId: currentUserId,
    });
    return result;
  } catch (error) {
    console.error(`Failed to mark message ${messageId} as read:`, error);
    if (typeof error === 'string') {
      throw new Error(error);
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unknown error occurred while marking the message as read.");
    }
  }
};

export const sendMessageApi = async (payload: SendMessagePayload): Promise<number> => {
  try {
    if (!payload.message_content.trim()) {
      // Frontend validation, though backend also validates
      throw new Error("消息内容不能为空");
    }
    if (!payload.title.trim()) {
      // Frontend validation, though backend also validates
      throw new Error("消息标题不能为空");
    }
    if (payload.sender_id === payload.receiver_id) {
      throw new Error("发送者和接收者不能是同一用户");
    }
    // The backend command is "send_message" and expects the payload wrapped in a "data" field.
    const result = await invoke<number>("admin_send_message", { data: payload });

    // Backend returns:
    // Ok(0) -> Message sent successfully
    // Ok(1) -> Sender not found
    // Ok(2) -> Receiver not found
    // Err(string) -> Other errors (which invoke will throw as an error)

    if (result === 0) {
      return 0; // Success
    } else if (result === 1) {
      throw new Error("发送方用户不存在。");
    } else if (result === 2) {
      throw new Error("接收方用户不存在。");
    } else {
      // This case should ideally not be reached if backend strictly returns 0, 1, or 2 for Ok variants.
      throw new Error(`发送消息时发生未知服务端状态码: ${result}`);
    }
  } catch (error) {
    console.error("Failed to send message:", error);
    if (typeof error === 'string') {
      // This can be an error message from invoke if the command itself fails (e.g., command not found)
      // or a string error from the Rust Err(String)
      throw new Error(error);
    } else if (error instanceof Error) {
      throw error; // Rethrow errors from validation or specific error cases above
    } else {
      throw new Error("发送消息时发生未知网络或系统错误。");
    }
  }
};

export const customerSendMessageApi = async (payload: CustomerSendMessagePayload): Promise<number> => {
  try {
    if (!payload.message_content.trim()) {
      throw new Error("消息内容不能为空");
    }
    // Title can be optional, backend handles Option<String>
    // Backend's customer_send_message determines admin receiver and validates sender.

    const result = await invoke<number>("customer_send_message", { data: payload });

    // Backend returns:
    // Ok(0) -> Message sent successfully
    // Ok(1) -> Sender (customer) not found
    // Ok(2) -> Administrator (receiver) not found
    // Err(string) -> Other errors

    if (result === 0) {
      return 0; // Success
    } else if (result === 1) {
      throw new Error("发送方用户不存在或非客户账户。");
    } else if (result === 2) {
      throw new Error("管理员账户未找到，无法发送消息。");
    } else {
      throw new Error(`发送消息时发生未知服务端状态码: ${result}`);
    }
  } catch (error) {
    console.error("Failed to send customer message:", error);
    if (typeof error === 'string') {
      throw new Error(error);
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("发送客户消息时发生未知网络或系统错误。");
    }
  }
};