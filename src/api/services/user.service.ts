import { container } from "tsyringe";
import type { Lavamusic } from "../../structures";
import { kClient } from "../../types";
import { Base64, LavalinkNode } from "lavalink-client";
import { User } from "discord.js";

export class UserService {
  private client: Lavamusic;
  constructor() {
    this.client = container.resolve<Lavamusic>(kClient);
  }

  getUser(userId: string) {
    return this.client.users.cache.get(userId);
  }

  public async getRecommendedTracks(userId: string) {
    const user = await this.client.users.fetch(userId).catch(() => null);
    if (!user) return [];
      const lastPlayedTrack = await this.client.db.getLastPlayedTrack(userId);
      console.log(lastPlayedTrack);
    if (!lastPlayedTrack) return [];
    const encoded = lastPlayedTrack.encoded as Base64;

    const nodes = this.client.manager.nodeManager.leastUsedNodes();
    const node = nodes[Math.floor(Math.random() * nodes.length)];

    if (!node || !node.connected || !encoded) return [];
    const track = await node.decode.singleTrack(encoded, user);
    switch (track.info.sourceName) {
      case "spotify":
        return this.recommendTracks.spotify(node, track.info.identifier, user);
      case "youtube":
      case "youtubemusic":
        return this.recommendTracks.youtube(node, track.info.identifier, user);
      case "jiosaavn":
        return this.recommendTracks.jiosaavn(node, track.info.identifier, user);
      default:
        return this.recommendTracks.youtube(node, track.info.identifier, user);
    }
  }

  private recommendTracks = {
    spotify: async (node: LavalinkNode, identifier: string, user: User) => {
      const res = await node.search(
        {
          query: `seed_tracks=${identifier}`,
          source: "sprec",
        },
        user
      );
      return res.tracks;
    },
    youtube: async (node: LavalinkNode, identifier: string, user: User) => {
      const res = await node.search(
        {
          query: `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`,
          source: "youtube",
        },
        user
      );
      return res.tracks;
    },
    jiosaavn: async (node: LavalinkNode, identifier: string, user: User) => {
      const res = await node.search(
        {
          query: `jsrec:${identifier}`,
          source: "jsrec",
        },
        user
      );
      return res.tracks;
    },
  };
}
