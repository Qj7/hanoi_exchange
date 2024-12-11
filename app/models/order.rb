class Order < ApplicationRecord
  belongs_to :recipient, class_name: 'User'
  belongs_to :exchanger, class_name: 'User'

  validates :rating, inclusion: { in: 1..5 }, allow_nil: true
end
