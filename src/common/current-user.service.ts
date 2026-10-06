import { Injectable } from '@nestjs/common';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

const CONSTANT_CURRENT_USER: CurrentUser = {
  id: 1,
  username: 'user_1',
  email: 'user1@example.com',
};

export function getCurrentUser(): CurrentUser {
  return CONSTANT_CURRENT_USER;
}

@Injectable()
export class CurrentUserService {
  private static instance: CurrentUserService;

  public static getInstance(): CurrentUserService {
    if (!CurrentUserService.instance) {
      CurrentUserService.instance = new CurrentUserService();
    }
    return CurrentUserService.instance;
  }

  getCurrentUser(): CurrentUser {
    return getCurrentUser();
  }
}
