import { invoke } from "@tauri-apps/api/core";

export interface LostItem {
    id: number;
    item_name: string;
    pick_place?: string;
    pick_user_id?: number;
    pick_user_name?: string; // Added
    claim_user_id?: number;
    claim_user_name?: string; // Added
    pick_time?: string; // Assuming NaiveDate from Rust serializes to string
    claim_time?: string; // Assuming NaiveDate from Rust serializes to string
    status: 0 | 1; // 0: Unclaimed, 1: Claimed
}

interface ReportLostItemPayload {
    item_name: string;
    pick_place?: string;
    pick_user_id?: number;
}

/**
 * Fetches all lost items from the backend.
 * @returns A promise that resolves to an array of LostItem objects.
 */
export const getAllLostItems = async (): Promise<LostItem[]> => {
    try {
        const items = await invoke<LostItem[]>('get_all_lost_items');
        return items;
    } catch (error) {
        // Consider re-throwing the error or returning a more specific error object
        // if the caller needs to handle it differently.
        throw error; // Re-throw to allow caller to handle
    }
};

export const claimLostItem = async (itemId: number, claim_user_id: number): Promise<number> => {
    try {
        await invoke('claim_lost_item', { data: { item_id: itemId, claim_user_id: claim_user_id } });
        return 0;
    } catch (err) {
        return 1;
    }
}

export const reportLostItem = async (reportData: ReportLostItemPayload): Promise<void> => {
    try {
        await invoke('report_lost_item', { data: reportData });
    } catch (error) {
        throw error; // Re-throw to allow caller to handle
    }
}