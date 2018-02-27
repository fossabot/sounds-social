import moment from 'moment'
import { check, Match } from 'meteor/check'
import { Random } from 'meteor/random'
import { resolver, typeDef } from 'meteor/easy:graphqlizer'
import { soundCollection, soundSchema } from '../../data/collection/SoundCollection'
import { fileCollection } from '../../data/collection/FileCollection'
import { groupCollection } from '../../data/collection/GroupCollection'
import { soundSearchIndex } from '../../data/search/SoundSearchIndex'

let soundsBeingPlayed = []

const inputSoundSchema = new SimpleSchema({
  name: {
    type: String,
  },
  description: {
    type: String,
    optional: true,
  },
  isPublic: {
    type: Boolean,
    optional: true,
  },
  creatorId: {
    type: String,
  },
  file: {
    type: Object,
    optional: true,
  }
})

// TODO: fix graphqlFilters and graphqlContext inside collection
export default {
  resolvers: {
    Query: {
      getSound: resolver.get(soundCollection),
      listSound: resolver.list(soundCollection),
      searchSound: (root, args, context, ast) => {
        const { query } = args
        check(query, String)

        let { userId } = context
        check(userId, Match.Optional(String))

        if (!userId) userId = null

        return soundSearchIndex.search(query, { limit: 100, userId }).fetch()
      },
      listSoundForPlaylist: (root, args, context, ast) => {
        const { playlistId } = args
        check(playlistId, String)

        const { userId } = context
        check(userId, Match.Optional(String))

        return soundCollection.fetchForPlaylist(playlistId, userId)
      },
    },
    Mutation: {
      updateSound: resolver.update(soundCollection),
      deleteSound: resolver.delete(soundCollection),
      createSound: (root, args, context) => {
        const { userId } = context
        const { groupId } = args
        check(userId, String)
        check(groupId, Match.Maybe(String))

        return soundCollection.addSound(args.data, userId, groupId)
      },
      publishSound: (root, args, context) => {
        const { userId } = context
        const { soundId } = args

        check(userId, String)
        check(soundId, String)

        return soundCollection.publishSound(soundId, userId)
      },
      startPlayingSound: (root, args, context) => {
        const { userId } = context
        const { soundId } = args

        check(userId, Match.Optional(String))
        check(soundId, String)

        const soundPlayingId = Random.id()

        soundsBeingPlayed.push({
          soundPlayingId,
          soundId,
          userId,
          startedAt: new Date(),
        })

        return { soundPlayingId, soundId }
      },
      countPlayingSound: (root, args, context) => {
        const { userId } = context
        check(userId, Match.Optional(String))

        const { soundPlayingId, soundId } = args
        check(soundPlayingId, String)
        check(soundId, String)

        const shouldCountPlay = soundsBeingPlayed
          .filter(play => play.userId === userId)
          .every(play => {
            const sameIds = play.soundPlayingId === soundPlayingId && play.soundId === soundId
            const startedFiveSecondsAgo = moment
              .duration(moment(new Date()).diff(play.startedAt)).seconds() > 5

            return sameIds && startedFiveSecondsAgo
          })

        if (shouldCountPlay) soundCollection.countPlay(soundId)

        soundsBeingPlayed = soundsBeingPlayed.filter(play => play.userId !== userId)

        return { soundPlayingId, soundId }
      },
      addCoverFile: (root, args, context) => {
        const { soundId, fileData } = args
        check(soundId, String)
        check(fileData, {
          _id: String,
          secret: String,
          url: String,
        })

        const sound = soundCollection.findOne({ _id: soundId, creatorId: context.userId })

        if (sound) soundCollection.updateCover(soundId, fileData)

        return sound
      },
    },
    Sound: {
      file: root => fileCollection.findOneById(root.fileId),
      playsCount: root => root.playsCount || 0,
      coverFile: root => fileCollection.findOneById(root.coverFileId),
      creator: root => {
        if (!root.ownerType || root.ownerType === 'user') {
          return {
            ...Meteor.users.findOne({ _id: root.creatorId }),
            type: 'user',
          }
        }

        const group = groupCollection.findOneById(root.creatorId)

        if (group) return { ...group, username: group.name, type: 'group' }
      },
      isRemovable: (root, args, context) => {
        if (!root.ownerType || root.ownerType === 'user') {
          return root.creatorId === context.userId
        }

        return !!groupCollection.isMemberOfGroup(context.userId, root.creatorId)
      },
    },
  },
  typeDefs: [
    typeDef.get('Sound'),
    typeDef.list('Sound'),
    typeDef.update('Sound'),
    typeDef.delete('Sound'),
    `
    type Sound {
      _id: String!
      name: String!
      description: String
      createdAt: Date
      fileId: String!
      ownerType: String
      isPublic: Boolean!
      playsCount: Int
      file: File
      creator: Creator
      coverFile: File
      isRemovable: Boolean
    }
    
    input SoundInput {
      name: String!
      description: String
      isPublic: Boolean
      creatorId: String!
      file: FileData
    }
    
    # Represents a sound being played
    type SoundPlay {
      # Random id when sound is started playing
      soundPlayingId: String
      soundId: String
    }
    
    extend type Mutation {
      createSound(data: SoundInput! groupId: String): Sound
      publishSound(soundId: String!): Sound
      addCoverFile(soundId: String! fileData: FileData!): Sound
      startPlayingSound(soundId: String!): SoundPlay
      countPlayingSound(soundPlayingId: String! soundId: String!): SoundPlay
    }
    
    extend type Query {
      searchSound(query: String!): [Sound]
      listSoundForPlaylist(playlistId: String!): [Sound]
    }
    `,
  ],
}
