class AddTelegramFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :telegram_id, :string
    add_column :users, :telegram_username, :string
  end
end
