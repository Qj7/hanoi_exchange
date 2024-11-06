class CreateOrders < ActiveRecord::Migration[7.2]
  def change
    create_table :orders do |t|
      t.string :name
      t.string :currency
      t.decimal :sum, precision: 10, scale: 2
      t.string :to_receive_currency
      t.decimal :to_receive_amount, precision: 10, scale: 2
      t.string :payment_method
      t.string :delivery_method

      t.timestamps
    end
  end
end
