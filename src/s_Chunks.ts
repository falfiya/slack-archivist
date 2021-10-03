/**
 * this is probably going to be the thing that makes the least sense in here.
 * so why are we recording which chunks of messages we've downloaded? well,
 * if someone were to go along and nuke or edit a whole bunch of messages in a
 * server, it would be nice to know when the archive of those specific messages
 * was performed.
 *
 * at least, that's what you, the user care about. for this program, it serves
 * as records keeping. this archiver probably wants to download whatever's in
 * between the bits it's already downloaded. kinda like a torrent client.
 * unarchived messages can appear in the past or future so you can imagine a gap
 * always being at the very beginning and very end that can never be filled.
 */
import {Timestamp} from "./slack";
import {object, array, u64, transmute} from "./types";

export type MessageChunk = {
   oldest: Timestamp;
   latest: Timestamp;
   finishedAt: u64;
}
export namespace MessageChunk {
   export function into(u: unknown): MessageChunk {
      return transmute(u)
         .into(object.into)
         .fieldInto("oldest", Timestamp.into)
         .fieldInto("latest", Timestamp.into)
         .fieldInto("finishedAt", u64.into)
         .it;
   }
}

export type Gap = {
   oldest?: Timestamp;
   latest?: Timestamp;
};

export class sChunks extends Array<MessageChunk> {
   static default(): sChunks {
      return [];
   }

   static into(u: unknown): sChunks {
      const ary = transmute(u)
         .into(array.intoUnknown)
         .into(array.into(MessageChunk.into))
         .it;

      let lastTs = Timestamp.MIN;
      for (const chunk of ary) {
         if (lastTs > chunk.oldest) {
            throw new TypeError("Chunks out of order!");
         }
         lastTs = chunk.latest;
      }

      return ary;
   }

   static gapMax(c: sChunks): number {
      return c.length;
   }

   static getGap(c: sChunks, idx: number): Gap {
      return {
         oldest: c[idx - 1]?.latest,
         latest: c[idx]?.oldest,
      };
   }

   static insert(into: sChunks, m: MessageChunk): boolean {
      let upper = into.length - 1;

      // empty
      if (upper === -1) {
         into.push(m);
         return true;
      }

      // first
      if (m.latest <= into[0].oldest) {
         into.unshift(m);
         return true;
      }

      // last
      if (m.oldest >= into[upper].latest) {
         into.push(m);
         return true;
      }

      // somewhere in the middle
      let lower = 1;
      while (lower !== upper) {
         const halfLength = upper - lower >> 1;
         const pivot = lower + halfLength;
         if (m.latest <= into[pivot].oldest) {
            upper = pivot;
            continue;
         }
         if (m.oldest >= into[pivot].latest) {
            lower = pivot + 1;
            continue;
         }
         return false;
      }

      // normally, we couldn't guarantee that lower is a valid index into the
      // array. however, the special optimizations above checking for empty,
      // first, and last mean that if we have reached this line of execution,
      // we know that into[lower] is a valid array element which is not the
      // first nor last element in the array. Thereforem, we also know that
      // into[lower - 1] and into[lower + 1] point to valid elements within the
      // array. In the following code, we are only going to use the former.

      // with that the knowledge that
      //    m.latest <= into[lower]
      // or m.oldest >= into[lower - 1],
      // we must check that it can comfortably fit between
      // into[lower - 1] and into[lower].

      if (into[lower - 1].latest <= m.oldest)
      if (into[lower + 0].oldest >= m.latest)
      {
         into.splice(lower, 0, m);
         return true;
      }

      return false;
   }
}
