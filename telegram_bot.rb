#telegram_bot.rb
require 'telegram/bot'
require 'logger'
require_relative 'config/environment'

Telegram::Bot::Client.run(ENV['TELEGRAM_BOT_TOKEN'], logger: Logger.new(STDOUT)) do |bot|
  begin
    bot.listen do |message|
      chat_id = message.chat.id
      username = message.from.username
      case message
      when Telegram::Bot::Types::Message
        # Отправляем изображение
        photo_path = Rails.root.join('app', 'assets', 'images', 'bstart.png').to_s
        photo = File.open(photo_path, 'rb')

        caption = <<~CAPTION
        🆗Личная встреча Дананг
        🆗Выдаем по QR коду

        ✅ Доставка бесплатно
        CAPTION

        # Создаем кнопку для веб-приложения
        kb = [[Telegram::Bot::Types::InlineKeyboardButton.new(text: '💶 Начать обмен', web_app: { url: "https://e86f-1-54-154-188.ngrok-free.app?chat_id=#{chat_id}&username=#{username}" })]]
        markup = Telegram::Bot::Types::InlineKeyboardMarkup.new(inline_keyboard: kb)

        bot.api.send_photo(chat_id: chat_id, photo: UploadIO.new(photo, 'image/png', 'bstart.png'), caption: caption, reply_markup: markup)
      end
    end
  rescue StandardError => e
    logger = Logger.new(STDOUT)
    logger.error("Произошла ошибка: #{e.message}")
  end
end
