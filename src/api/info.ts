// src/api/info.ts
import { invoke } from '@tauri-apps/api/core';
import type { Account, MonthlyConsumptionSummary, GoodsConsumptionShare } from './user'; // Assuming types are in user.ts

// Types might need to be re-exported or defined here if not already available globally
// For now, we assume they are correctly imported from './user'

// Admin Info APIs
export const getTotalUsers = async (): Promise<number> => {
    return await invoke<number>('get_total_users');
};

export const getNewUsersThisMonth = async (): Promise<number> => {
    return await invoke<number>('get_new_users_this_month');
};

export const getAdminMonthlyConsumptionSummary = async (): Promise<MonthlyConsumptionSummary[]> => {
    const data = await invoke<MonthlyConsumptionSummary[]>('get_monthly_consumption_summary');
    return data.map(item => ({ ...item, total_amount: Number(item.total_amount) }));
};

export const getGoodsConsumptionShareCurrentMonth = async (): Promise<GoodsConsumptionShare[]> => {
    const data = await invoke<GoodsConsumptionShare[]>('get_goods_consumption_share_current_month');
    return data.map(item => ({
        ...item,
        goods_name: String(item.goods_name),
        amount: Number(item.amount)
    }));
};

// Customer Info APIs
export const getUserDetails = async (userId: number): Promise<Account> => {
    return await invoke<Account>('get_user_details', { userId });
};

export const getUserMonthlyConsumption = async (userId: number): Promise<MonthlyConsumptionSummary[]> => {
    const data = await invoke<MonthlyConsumptionSummary[]>('get_user_monthly_consumption', { userId });
    return data.map(item => ({
        ...item,
        total_amount: Number(item.total_amount)
    }));
};
