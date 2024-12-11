class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :received_orders, class_name: 'Order', foreign_key: :recipient_id
  has_many :exchanged_orders, class_name: 'Order', foreign_key: :exchanger_id
end
