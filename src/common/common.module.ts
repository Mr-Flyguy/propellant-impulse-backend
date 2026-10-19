import { Module, Global } from '@nestjs/common';
import { CurrentUserService } from './current-user.service';

@Global()
@Module({
  providers: [CurrentUserService],
  exports: [CurrentUserService],
})
export class CommonModule {}
