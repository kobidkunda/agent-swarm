import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FoldersService } from './folders.service';

@Controller('api/folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFolder(@Body() body: any) {
    return this.foldersService.createFolder(body);
  }

  @Get()
  async getAllFolders() {
    return this.foldersService.getAllFolders();
  }

  @Get('enabled')
  async getEnabledFolders() {
    return this.foldersService.getEnabledFolders();
  }

  @Get(':id')
  async getFolder(@Param('id') id: string) {
    const folder = await this.foldersService.getFolderById(id);
    if (!folder) {
      return { error: 'Folder not found' };
    }
    return folder;
  }

  @Put(':id')
  async updateFolder(@Param('id') id: string, @Body() body: any) {
    return this.foldersService.updateFolder(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFolder(@Param('id') id: string) {
    await this.foldersService.deleteFolder(id);
  }
}
