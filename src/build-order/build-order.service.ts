import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NewBuild } from './dto/newBuild.dto';
import { GetAllBuild } from './dto/getAllBuild.dto';
import { DeleteBuild } from './dto/deleteBuild.dto';
import { AddLine } from './dto/addLine.dto';
import { GetAllLines } from './dto/getAllLines.dto';
import { SwapLine } from './dto/swapLine.dto';
import { DeleteLine } from './dto/deleteLine.dto';

@Injectable()
export class BuildOrderService {
    constructor(private readonly prismaService: PrismaService) {}
    async newBuild(buildNameDto: NewBuild) {
        const { title, desc, playrace, versusrace, User_id } = buildNameDto;

        const user = await this.prismaService.buildName.findFirst({
            where: { title }
        });

        if (user) throw new ConflictException('Build name already exists');

        await this.prismaService.buildName.create({
            data: {
                title,
                desc,
                playrace: parseInt(playrace),
                versusrace: parseInt(versusrace),
                User_id: parseInt(User_id)
            }
        });

        await this.prismaService.$disconnect();

        return buildNameDto;
    }

    async getAllBuild(getAllBuildDto: GetAllBuild) {
        const { id } = getAllBuildDto;

        const buildNames = await this.prismaService.buildName.findMany({
            where: {
                User_id: parseInt(id)
            }
        });

        await this.prismaService.$disconnect();

        return buildNames;
    }

    async deleteBuild(deleteBuildDto: DeleteBuild) {
        const { id } = deleteBuildDto;

        try {
            const deletedBuildName = await this.prismaService.buildName.delete({
                where: {
                    id: parseInt(id)
                }
            });
            console.log(deletedBuildName);
        } catch (error) {
            console.error('Error deleting BuildName:', error);
            throw error;
        } finally {
            await this.prismaService.$disconnect();
        }
    }

    async addLine(addLineDto: AddLine) {
        const { desc, population, timer, buildName_id, position } = addLineDto;

        console.log(addLineDto);
        console.log("position: " + JSON.stringify(position));

        await this.prismaService.buildStep.create({
            data: {
                desc,
                population: parseInt(population),
                timer: parseInt(timer),
                buildName_id: parseInt(buildName_id),
                position: +position,
            }
        });
        await this.prismaService.$disconnect();
    }

    async getAllLines(getAllLinesDto: GetAllLines) {
        const { id } = getAllLinesDto;
        console.log(getAllLinesDto);

        const buildLines = await this.prismaService.buildStep.findMany({
            where: {
                buildName_id: parseInt(id)
            }
        });

        await this.prismaService.$disconnect();

        return buildLines;
    }

    async exchange_position_by_id(index1: number, index2: number): Promise<void> {
        const transaction: any = await this.prismaService.$transaction([
            this.prismaService.buildStep.findUnique({
                where: { id: index1 },
            }),

            this.prismaService.buildStep.findUnique({
                where: { id: index2 },
            }),

        ]);

        console.log(transaction);
        if (!transaction[0] || !transaction[1]) {
            throw new Error('L\'un des utilisateurs n\'existe pas.');
        }

        const temp = transaction[0].position;
        transaction[0].position = transaction[1].position;
        transaction[1].position = temp;

        await this.prismaService.buildStep.update({
            where: { id: index1 },
            data: {
                position: transaction[0].position,
            },
        });

        await this.prismaService.buildStep.update({
            where: { id: index2 },
            data: {
                position: transaction[1].position,
            },
        });
    }


    async swapLineUp(swapLineDto: SwapLine) {
        const { id: init_id, buildId: build_id } = swapLineDto;

        try {
            const { position: init_position }: any = await this.prismaService.buildStep.findUnique({
                where: {
                    id: +init_id,
                },
            });

            const array_all_steps: any = await this.prismaService.buildStep.findMany({
                where: {
                    buildName_id: +build_id,
                },
            });

            const { id: prev_position_id } = array_all_steps.find((x: any) => x.position === (init_position - 1));
            this.exchange_position_by_id(prev_position_id, +init_id)

        } catch (error) {
            console.log("there is no prev_position");
        }
    }


    async swapLineDown(swapLineDto: SwapLine) {
        const { id: init_id, buildId: build_id } = swapLineDto;

        try {
            const { position: init_position }: any = await this.prismaService.buildStep.findUnique({
                where: {
                    id: +init_id,
                },
            });

            const array_all_steps: any = await this.prismaService.buildStep.findMany({
                where: {
                    buildName_id: +build_id,
                },
            });

            const { id: next_position_id } = array_all_steps.find((x: any) => x.position === (init_position + 1));
            this.exchange_position_by_id(next_position_id, +init_id)

        } catch (error) {
            console.log("there is no prev_position");
        }
    }

    async deleteLine(deleteLineDto: DeleteLine) {
        const { id } = deleteLineDto;

        try {
            const deletedLine = await this.prismaService.buildStep.delete({
                where: {
                    id: parseInt(id)
                }
            });
            return deletedLine;
        } catch (error) {
            console.error('Error deleting BuildName:', error);
            throw error;
        } finally {
            await this.prismaService.$disconnect();
        }
    }

    async getInfoOfOneBuild(body: any) {
        let build: any;

        try {
            build = await this.prismaService.buildName.findUnique({
                where: {
                    id: +body,
                },
            });
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            await this.prismaService.$disconnect();
        }

        return await build;
    }

    async getInfoBuild(body: any) {
        const { id } = body;

        let infoBuildOrder = await this.getInfoOfOneBuild(id);
        let listStep = await this.getAllLines({ id });
        return { ...infoBuildOrder, listStep }
    }
}
