import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { UpdateUserDto } from 'src/auth/dtos/update-user.dto';
import { UserDto } from 'src/auth/dtos/user.dto';
import { CardGateway } from 'src/card/card.gateway';
import { CardService } from 'src/card/card.service';
import { LocalAuthGuard, SuperUserAuthGuard } from 'src/guards/auth.guard';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { SubmitQuestionDto } from 'src/question/dto/submit-question.dto';
import { QuestionService } from 'src/question/question.service';
import { UsersService } from './user.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Card } from 'src/card/entities/card.entity';
import { CardDto } from 'src/card/dto/card.dto';
import { Reminder } from 'src/common/types';
import { Response } from 'express';
import { AddNoteDto } from 'src/common/add-note.dto';
@ApiTags('api/user')
@Controller('user')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private questionService: QuestionService,
    private cardService: CardService,
    private cardGateway: CardGateway,
  ) {}

  @Serialize(UserDto)
  @UseGuards(LocalAuthGuard)
  @Get('/profile')
  getMe(@Req() req) {
    console.log(req.user);
    return req.user;
  }
  @Serialize(UserDto)
  @UseGuards(LocalAuthGuard)
  @Patch('/profile/')
  update(@Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.updateByUsername(req.user.username, updateUserDto);
  }

  @UseGuards(SuperUserAuthGuard)
  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  // TODO: Super user has not been implemented yet, so no one can access this
  @UseGuards(SuperUserAuthGuard)
  @Get('/profiles/:username')
  getUserByUsername(@Param('username') username: string) {
    if (!username) {
      throw new NotFoundException('Username does not exist');
    }
    const user = this.usersService.findByUsername(username);

    return user;
  }
  @UseGuards(SuperUserAuthGuard)
  @Patch('/profiles/:username')
  updateByUsername(
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateByUsername(username, updateUserDto);
  }
  @UseGuards(SuperUserAuthGuard)
  @Delete('/profiles/:id')
  removeByUsername(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('/add-question/')
  async submitQuestion(
    @Headers('UUID') uuid: string,
    @Body() submitQuestionDto: SubmitQuestionDto,
    @Res() res: Response,
  ) {
    const user = await this.usersService.findOne(uuid).catch(() => {
      throw new NotFoundException('Cannot find the user');
    });
    const question = await this.questionService.upsert(
      submitQuestionDto.question,
    );

    const { status, card } = await this.cardGateway.handleSubmit(
      res,
      user,
      submitQuestionDto,
      question,
    );

    res.status(status).send(card);
  }

  @Post('/add-note')
  async submitNote(
    @Headers('UUID') uuid: string,
    @Body() addNoteDTO: AddNoteDto,
    @Res() res,
  ) {
    const user = await this.usersService.findOne(uuid).catch(() => {
      throw new NotFoundException('Cannot find the user');
    });

    try {
      const card = await this.cardService.findByQuestionIdAndUser(
        addNoteDTO.questionId,
        user,
      );
      if (card) {
        card.note = addNoteDTO.note;
        await this.cardService.update(card);
        res.status(200).send(card);
      }
    } catch (err) {
      throw new NotFoundException('Cannot find card');
    }
  }

  @Get('/cards-today/:uuid')
  async getCardsToday(@Param('uuid') uuid: string) {
    const user = await this.usersService.findOne(uuid).catch(() => {
      throw new NotFoundException('Cannot find the user');
    });

    let cards = await this.cardService.findActiveCards(user);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    cards = cards.filter(
      (card: Card) => card.next_rep_date.getTime() < todayEnd.getTime(),
    );

    const reminders: Reminder[] = cards.map((card: Card) => ({
      next_rep_date: card.next_rep_date,
      titleSlug: card.question.titleSlug,
      title: card.question.title,
      translatedTitle: card.question.translatedTitle,
    }));

    return reminders;
  }
}
