FROM node:current-alpine AS base

RUN apk update
RUN apk upgrade
RUN apk add --update --no-cache tzdata busybox-suid
ENV TZ=Asia/Bangkok

ENV APPDIR=/opt/jsc-node-scheduler
# Run the application every minute
RUN echo "* * * * *   cd ${APPDIR}/bin && node index.js 2>&1 >> ${APPDIR}/application.log" | tee -a /etc/crontabs/root
# Clear the logs once a month
RUN echo "0 0 1 * *   echo -n '' > ${APPDIR}/application.log" | tee -a /etc/crontabs/root

WORKDIR $APPDIR

FROM base AS build

RUN mkdir -p $APPDIR/build
COPY package.json tsconfig.json yarn.lock $APPDIR/build/
ADD src $APPDIR/build/src

RUN yarn --cwd $APPDIR/build
RUN yarn --cwd $APPDIR/build build

FROM base AS prod

COPY --from=build $APPDIR/build/node_modules/ $APPDIR/bin/node_modules/
COPY --from=build $APPDIR/build/bin $APPDIR/bin/
COPY --from=build $APPDIR/build/package.json $APPDIR/

CMD [ "crond", "-f"]
