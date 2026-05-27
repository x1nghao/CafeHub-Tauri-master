import { invoke } from "@tauri-apps/api/core";

export interface Account {
  id: number;
  username: string;
  phone?: string | null;
  gender?: number | null;
  join_time?: string | null;
  balance?: number | null;
  user_type: number;
}

export const login = async (uname: string, pwd: string): Promise<Account | null> => {
  try {
    // 后端的 "login" tauri 命令应该直接返回 Account 结构体或者在错误时抛出异常
    const account = await invoke<Account>("login", {
      username: uname,
      password: pwd,
    });
    // 如果 invoke 成功，它会返回 Account 对象
    return account;
  } catch (error) {
    // 如果 invoke 失败 (例如后端返回 Err 或 tauri 通信错误)，会进入 catch 块
    console.error("Login API call failed:", error);
    return null; // 返回 null 表示登录失败
  }
};

export const register = async (uname: string, pwd: string, phe: string, gen: number) => {
  try {
    let res = await invoke("register_user", {
      data: {
        username: uname,
        password: pwd,
        phone: phe,
        gender: gen, // Or pass actual gender if available (0 for Male, 1 for Female)
      },
    });
    let account: Account | null = null;
    if (res == 1) {
      //注册成功
      account = await login(uname, pwd);
      return account;
    } else if (res == 2) {
      throw new Error('用户名重复');
    } else if (res == 3) {
      throw new Error('手机号不是11位');
    } else if (res == 4) {
      throw new Error('性别设置错误');
    }
    return account;
  } catch (error) {
    console.error("register failed:", error);
    throw error;
  }
};

export interface MonthlyConsumptionSummary {
  month: string; // "YYYY-MM"
  total_amount: number;
}

export interface GoodsConsumptionShare {
  goods_name: string;
  amount: number;
}

