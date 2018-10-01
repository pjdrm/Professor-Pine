const {PartyStatus, Team} = require('../../app/constants'),
  {MessageEmbed} = require('discord.js'),
  Gym = require('../../app/gym'),
  Helper = require('../../app/helper'),
  PartyManager = require('../../app/party-manager'),
  Raid = require('../../app/raid'),
  Utility = require('../../app/utility');

class RaidReactions {
  static async reaction_builder(raid, statusMessage, raidChannel, useMap=true) {
    let interested_emoji = '⚠',
	    join_emoji = '✅',
	    leave_emoji = '❌',
	    here_emoji = '📍',
	    done_emoji = '🙏',
	    up_emoji = '⬆',
	    down_emoji = '⬇',
	    map_emoji = '🗺',
	    possible_emojis = [interested_emoji, join_emoji, leave_emoji, up_emoji, down_emoji, here_emoji, done_emoji];

    if(useMap){
      possible_emojis.push(map_emoji)
    }
    possible_emojis.forEach(async emoji => {
      await statusMessage.react(emoji);
    });


    //possible_emojis.forEach(async emoji => {
    //	statusMessage.react(emoji);
    //});

    const filter = (reaction, user) => {
        return possible_emojis.includes(reaction.emoji.name) && !user.bot;
    };

    const collector = statusMessage.createReactionCollector(filter, { time: 3600000});
    collector.on('collect', async (reaction, user) =>{
        if(reaction.emoji.name === map_emoji){
          const gymId = raid.gymId,
          gym = Gym.getGym(gymId),
          embed = new MessageEmbed();

          embed.setColor('GREEN');
          embed.setImage(`attachment://${gymId}.png`);

          raidChannel.send(`https://www.google.com/maps/search/?api=1&query=${gym.gymInfo.latitude}%2C${gym.gymInfo.longitude}`, {
              files: [
                require.resolve(`PgP-Data/data/images/${gymId}.png`)
              ],
              embed
            })
            .catch(err => log.error(err));
        }
        else{
          let party_status,
            attendee = raid.attendees[user.id],
            member = (await raid.getMember(user.id)).member,
            team_emoji = Helper.getTeamEmoji(member),
            additionalAttendees,
            embed,
            messageHeader = '';

          if(attendee){
            additionalAttendees = attendee.number-1
            
          }
          else{
            additionalAttendees = 0
          }
          
          if(reaction.emoji.name === join_emoji){
            embed = new MessageEmbed();
            embed.setTitle('Trainer has joined the raid!');
            embed.setColor('GREEN');
            party_status = PartyStatus.COMING;
          }
          else if(reaction.emoji.name === interested_emoji){
            embed = new MessageEmbed();
            embed.setTitle(`Trainer is interested in the raid!`)
            embed.setColor('#f6d405')
            party_status = PartyStatus.INTERESTED;
          }
          else if(reaction.emoji.name === leave_emoji){
            if (attendee) {
              embed = new MessageEmbed();
              embed.setTitle(`Trainer has left the raid!`)
              embed.setColor('RED')
            }
            party_status = PartyStatus.LEAVE;
            await raid.removeAttendee(user.id);
          }
          else if(reaction.emoji.name === here_emoji){
            embed = new MessageEmbed();
            embed.setTitle(`Trainer has arrived to the raid!`)
            embed.setColor('BLUE')
            party_status = PartyStatus.PRESENT;
          }
          else if(reaction.emoji.name === done_emoji){
            party_status = PartyStatus.COMPLETE;
          }
          else if(reaction.emoji.name === up_emoji){
            if (!attendee) {
              raidChannel.send(`**<@${user.id}>** you are not signed up for this raid!`)
              reaction.users.remove(user.id);
              return statusMessage;
            }
            else{
              additionalAttendees = attendee.number
              party_status = attendee.status
            }
          }
          else if(reaction.emoji.name === down_emoji){
            if (!attendee) {
              raidChannel.send(`**<@${user.id}>** you are not signed up for this raid!`)
              reaction.users.remove(user.id);
              return statusMessage;
            }
            else{
              if(attendee.number === 1){
                additionalAttendees = 0
              }
              else{
                additionalAttendees = attendee.number-2
              }
              party_status = attendee.status
            }
          }

          if (party_status !== PartyStatus.LEAVE){
            if(!attendee){
              messageHeader = `Welcome, <@${user.id}>`;
            }
            await raid.setMemberStatus(user.id, party_status, additionalAttendees);
          }
          raid.refreshStatusMessages();
          if(embed !== undefined){
            //embed.setAuthor(`${user.username}`, member.user.displayAvatarURL())
            embed.setDescription(`${team_emoji.toString()} ${user.username}`)
            raidChannel.send(messageHeader, embed)
          }
      }
      reaction.users.remove(user.id);
    });
  }
 }

 module.exports = RaidReactions;