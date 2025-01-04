import type { FastifyReply, FastifyRequest } from "fastify";
import { inject, injectable } from "tsyringe";
import { GuildService } from "../services/guild.service";

@injectable()
export class GuildController {
  constructor(
    @inject(GuildService) private readonly guildService: GuildService
  ) {}

  async userMeGuild(
    req: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const guilds = await this.guildService.getUserGuilds(accessToken);

    return reply.status(200).send(guilds);
  }

  async guild(
    req: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) {
    const guildId = req.params.guildId;
    const data = await this.guildService.getGuild(guildId);
    if (!data) {
      return reply.status(404).send({ message: "Guild not found" });
    }
    return reply.status(200).send(data);
  }
  async channels(
    req: FastifyRequest<{ Params: { guildId: string } }>,
    reply: FastifyReply
  ) {
    const guildId = req.params.guildId;
    const data = await this.guildService.getChannels(guildId);
    if (!data) {
      return reply.status(404).send({ message: "Channels not found" });
    }
    if (data && !data.channels.size) {
      return reply.status(404).send({ message: "There are no channels" });
    }
    return reply.status(200).send(data.channels);
  }
}
