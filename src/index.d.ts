declare module "cash-captcha" {
  export class Solver {
    constructor(apiKey: string, userConfig?: object);
    start(): Promise<void>;
    stop(): void;
    static initialize(apiKey: string, userConfig?: object): Solver;
  }

  export class Rewards {
    constructor(apiKey: string, claimKey: string, config?: object);
    info(): Promise<object>;
    history(
      epoch: number,
      page?: number,
      itemsPerPage?: number
    ): Promise<object>;
    claim(
      amount: number,
      withdrawalToken: string,
      withdrawalAddress: string
    ): Promise<object>;
  }

  export class Register {
    constructor(apiKey: string, claimKey: string, config: object);
    registerUser(email: string, referredBy?: string): Promise<object>;
    resetClaimKey(userApiKey: string): Promise<object>;
  }

  export function categorizeDevicePerformance(): Promise<{
    category: number;
    deviceInfo: object;
  }>;

  export function createConfig(userConfig?: object): object;
}
