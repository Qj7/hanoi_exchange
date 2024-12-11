# telegram_bot.rb
require 'telegram/bot'
require 'logger'
require_relative 'config/environment'

# Устанавливаем токен в зависимости от окружения
bot_token = Rails.env.development? ? ENV['TELEGRAM_BOT_TOKEN_DEV'] : ENV['TELEGRAM_BOT_TOKEN']
website_url = Rails.env.development? ? 'https://31fd-118-68-56-15.ngrok-free.app' : 'https://web-production-22d58.up.railway.app'

Telegram::Bot::Client.run(bot_token, logger: Logger.new(STDOUT)) do |bot|
  begin
    bot.listen do |message|
      chat_id = message.chat.id
      username = message.from.username
      case message
      when Telegram::Bot::Types::Message
        photo_path = Rails.root.join('app', 'assets', 'images', 'bstart.png').to_s
        photo = File.open(photo_path, 'rb')

        caption = <<~CAPTION
          🆗Личная встреча Дананг
          🆗Выдаем по QR коду

          ✅ Доставка бесплатно
        CAPTION

        kb = [ [ Telegram::Bot::Types::InlineKeyboardButton.new(text: '💶 Начать обмен', web_app: { url: "#{website_url}/?chat_id=#{chat_id}&username=#{username}" }) ] ]
        markup = Telegram::Bot::Types::InlineKeyboardMarkup.new(inline_keyboard: kb)

        bot.api.send_photo(chat_id: chat_id, photo: UploadIO.new(photo, 'image/png', 'bstart.png'), caption: caption, reply_markup: markup)
      end
    end
  rescue StandardError => e
    logger = Logger.new(STDOUT)
    logger.error("Произошла ошибка: #{e.message}")
  end
end
