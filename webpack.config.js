module.exports = function (env) {
    return require(`./webpack_envs/webpack.${env}.js`)
}