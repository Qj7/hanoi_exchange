class CreateExchangeRates < ActiveRecord::Migration[7.2]
  def change
    create_table :exchange_rates do |t|
      t.decimal :usdt, precision: 10, scale: 2
      t.decimal :rub, precision: 10, scale: 2
      t.decimal :vnd, precision: 10, scale: 2

      t.timestamps
    end
  end
end
