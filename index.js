const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const allowedUserId = '917071567077400576'; // Your allowed user ID, this user generates the embed with ,serverembed
const roleIds = [
    'YOUR OWNER ROLE ID', // owner
    'YOUR ADMIN ROLE ID', // admin
    'MORE IDS', // lead mod
    'MORE IDS', // mod
    'YOUR TRIAL MOD ID' // trial mod
];

client.once('ready', () => {
    console.log(`Bot is ready as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === ',serverembed' && message.author.id === allowedUserId) {
        const guild = message.guild;

        // Send an introductory embed
        const introEmbed = new EmbedBuilder()
            .setTitle('<:dot:1299319629168250890> **Team Overview**')
            .setColor('#f2e7ba')
            .setFooter({ text: 'h3 cabin' })
            .setTimestamp();

        await message.channel.send({ embeds: [introEmbed] });

        // Fetch all members in the guild
        const allMembers = await guild.members.fetch();

        // Loop through each role ID to fetch members
        for (const roleId of roleIds) {
            const role = guild.roles.cache.get(roleId);
            if (!role) continue; // Skip if the role doesn't exist
        
            // Placeholder embed for the role
            const placeholderEmbed = new EmbedBuilder()
                .setTitle(`<:dot:1299319629168250890> **${role.name}**:`) // Title with emoji before the role name
                .setColor(role.hexColor) // Color based on the role's color
                .setFooter({ text: 'h3 cabin' })
                .setTimestamp();
        
            // Send the placeholder embed
            await message.channel.send({ embeds: [placeholderEmbed] });
        
            const membersWithRole = allMembers.filter(member => member.roles.cache.has(roleId));
        
            if (membersWithRole.size === 0) {
                // Handle case when there are no members for the role
                const noMembersEmbed = new EmbedBuilder()
                    .setTitle(`<:placeholder:1299319617021284393> ${role.name}`) // Title with emoji before the role name
                    .setColor(role.hexColor)
                    .setDescription('There are currently no members with this role.\nPerhaps this is your chance to join the team ;)')
                    .setFooter({ text: 'h3 cabin' })
                    .setTimestamp();
        
                const applyButton = new ButtonBuilder()
                    .setCustomId(`apply_${roleId}`)
                    .setLabel('Apply')
                    .setStyle(ButtonStyle.Primary);
        
                const buttonRow = new ActionRowBuilder().addComponents(applyButton);
        
                // Send the "no members" embed with the button
                await message.channel.send({ embeds: [noMembersEmbed], components: [buttonRow] });
        
            } else {
                // Handle members with the role
                for (const [memberId, member] of membersWithRole) {
                    const displayName = member.displayName;
                    const avatarUrl = member.user.displayAvatarURL({ format: 'png', dynamic: true });
                    const memberRoles = member.roles.cache.filter(role => roleIds.includes(role.id));
                    const roleNames = memberRoles.map(role => role.name).join(', ');
        
                    const memberEmbed = new EmbedBuilder()
                        .setTitle(`<:placeholder:1299319617021284393> ${displayName} (${role.name})`)
                        .setThumbnail(avatarUrl)
                        .setColor(role.hexColor)
                        .setDescription(`**Role:** ${roleNames}\n**User:** ${member.user.tag}`)
                        .setTimestamp();
        
                    await message.channel.send({ embeds: [memberEmbed] });
                }
        
                // If it's this role, add a special embed after listing all members, with application button.
                if (roleId === 'YOUR TRIAL MOD ID') {
                    const additionalEmbed = new EmbedBuilder()
                        .setTitle(`<:placeholder:1299319617021284393> ${role.name}`)
                        .setColor(role.hexColor)
                        .setDescription('There are not enough members with this role yet.\nPerhaps this is your chance to join the team ;)')
                        .setFooter({ text: 'h3 cabin' })
                        .setTimestamp();
        
                    const applyButton = new ButtonBuilder()
                        .setCustomId(`apply_${roleId}`)
                        .setLabel('Apply')
                        .setStyle(ButtonStyle.Primary);
        
                    const buttonRow = new ActionRowBuilder().addComponents(applyButton);
        
                    // Send the additional embed with the button
                    await message.channel.send({ embeds: [additionalEmbed], components: [buttonRow] });
                }
            }
        }
    }
});

// Handle button interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        const { customId, user } = interaction;

        console.log('Button interaction received:', customId); // Log the button interaction

        if (customId.startsWith('apply_')) {
            const roleId = customId.split('_')[1];

            // Create a modal for the application form
            const modal = new ModalBuilder()
                .setCustomId(`application_modal_${roleId}`)
                .setTitle('Application Form');

            // Create a text input for the application reason
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason_input')
                .setLabel('Why are you a good fit for this role?')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(10)
                .setMaxLength(500)
                .setRequired(true);

            // Create an action row and add the input field to it
            const actionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(actionRow);

            // Show the modal to the user
            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        const modalId = interaction.customId;
    
        if (modalId.startsWith('application_modal_')) {
            const roleId = modalId.split('_')[2];
            const reason = interaction.fields.getTextInputValue('reason_input');
            const applicantUser = interaction.user; // Get the user from the interaction
            
            // Build the application embed
            const applicationEmbed = new EmbedBuilder()
                .setTitle('New Application')
                .setColor('#00FF00')
                .setDescription(`**User:** <@${applicantUser.id}>\n**Application for Role:** <@&${roleId}>\n**Application Text:** ${reason}`)
                .setThumbnail(applicantUser.displayAvatarURL({ dynamic: true })) // User's profile picture
                .setTimestamp();
    
            // Send the application embed to the specified channel
            const applicationChannel = client.channels.cache.get('YOUR APPLICATION CHANNEL'); // Replace with your target channel ID
            if (applicationChannel) {
                try {
                    await applicationChannel.send({ embeds: [applicationEmbed] });
                    await interaction.reply({ content: 'Your application has been submitted!', ephemeral: true });
                } catch (error) {
                    console.error('Error sending application embed:', error);
                    await interaction.reply({ content: 'Error submitting application. Please try again later.', ephemeral: true });
                }
            } else {
                console.error('Error: Target channel not found.');
                await interaction.reply({ content: 'Error: Target channel not found.', ephemeral: true });
            }
        }
    }
});


client.login('YOUR BOT TOKEN'); // Replace with your bot's token
