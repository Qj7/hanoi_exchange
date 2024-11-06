# syntax = docker/dockerfile:1

# Установка базового образа для Ruby
ARG RUBY_VERSION=3.1.2
FROM ruby:$RUBY_VERSION-slim AS base

# Установка рабочей директории для Rails
WORKDIR /rails

# Установка базовых пакетов
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Установка переменных окружения
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development test"

# Стадия сборки для установки зависимостей и сборки приложения
FROM base AS build

# Установка пакетов, необходимых для сборки гемов и node-модулей
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Установка Node.js версии 18 и Yarn
ARG NODE_VERSION=18
RUN curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Установка зависимостей приложения
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Установка JavaScript-зависимостей
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Копирование кода приложения
COPY . .

ARG SECRET_KEY_BASE
ENV SECRET_KEY_BASE=${SECRET_KEY_BASE}

RUN bundle exec rails assets:precompile

# Удаление node_modules для уменьшения размера образа
RUN rm -rf node_modules

# Финальная стадия, минимизация размера конечного образа
FROM base

# Копирование установленных зависимостей
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

# Создание пользователя для запуска приложения
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER 1000:1000

# Определение точки входа и команды запуска
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Запуск сервера и бота
EXPOSE 3000
CMD bundle exec rails server -b 0.0.0.0 -p $PORT && bundle exec ruby telegram_bot.rb
