class HomeController < ApplicationController
  DELIVERY_METHODS = ['Доставка курьером', 'По QR в банкомате']
  PAY_METHODS = ['Сбербанк', 'Райффайзен банк', 'ВТБ', 'Перевод СБП', 'Тинькофф', 'Bybit UID', 'Перевод USDT', 'Binance', 'Revolut']

  def index
    @delivery_methods = DELIVERY_METHODS
    @payment_methods = PAY_METHODS
    @exchange_rate = ExchangeRate.order(created_at: :desc).first
    current_or_guest_user.update!(telegram_id: params[:chat_id], telegram_username: params[:username])
  end

  def create
    p '--------------'
    p params
    order = Order.create(
      name: params[:name],
      currency: params[:from_currency],
      sum: params[:sum],
      to_receive_currency: params[:to_currency],
      to_receive_amount: params[:to_receive_amount],
      payment_method: params[:payment_method],
      delivery_method: params[:delivery_method]
    )

    message = <<-MESSAGE
      📅 Создана: #{order.created_at.strftime("%d.%m %H:%M")}
      ~•~•~•~•~•~•~•~•~•~•~•~•~•~•~
      👤 Связаться: https://t.me/#{current_or_guest_user.telegram_username}
      Отправляют: #{order.sum} #{order.currency}
      К получению: #{order.to_receive_amount} #{order.to_receive_currency}
      Способ оплаты: #{order.payment_method}
      Способ получения: #{order.delivery_method}
      ~•~•~•~•~•~•~•~•~•~•~•~•~•~•~
    MESSAGE

    TelegramApi.new(ENV['WORKING_CHAT_ID']).send_message_to_telegram(message)

    render json: {}, status: :ok
  end

  def calculate_exchange
    params.require(:home).permit(:from_currency, :to_currency, :amount)

    from_currency = params[:from_currency]
    to_currency = params[:to_currency]
    amount = params[:amount].to_f

    Rails.logger.debug "Получены параметры: from_currency=#{from_currency}, to_currency=#{to_currency}, amount=#{amount}"

    rate = get_exchange_rate(from_currency, to_currency)
    if rate
      converted_amount = (amount * rate).round(2) # Округляем результат сразу до 2 знаков
      Rails.logger.debug "Converted amount after rounding: #{converted_amount}"

      render json: { converted_amount: converted_amount }, status: :ok
    else
      render json: { error: "Курс недоступен" }, status: :unprocessable_entity
    end
  end

  private

  def get_exchange_rate(from_currency, to_currency)
    exchange_rate = ExchangeRate.order(created_at: :desc).first

    # Логгирование текущих курсов для отладки
    Rails.logger.debug "Текущий курс RUB: #{exchange_rate.rub}, VND: #{exchange_rate.vnd}, USDT: #{exchange_rate.usdt}"

    case [from_currency, to_currency]
    when ["RUB", "VND"]
      (exchange_rate.vnd / exchange_rate.rub).round(6) # Применяем округление для результата
    when ["VND", "RUB"]
      (exchange_rate.rub / exchange_rate.vnd).round(6)
    when ["USDT", "VND"]
      exchange_rate.vnd.round(6)
    when ["VND", "USDT"]
      (1 / exchange_rate.vnd).round(6)
    when ["RUB", "USDT"]
      (1 / exchange_rate.rub).round(6)
    when ["USDT", "RUB"]
      exchange_rate.rub.round(6)
    else
      nil
    end
  end
end
