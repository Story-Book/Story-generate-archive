var fs = require('story-fs');

function getYearList (pathData) {
    return new Promise(function (resolve, reject) {
        var result = {};
        try {
            pathData = pathData.filter(function (path) {
                var year = path.slice(path.lastIndexOf('/') + 1);
                return year.length === 4 && (result[year] = path);
            });
            return resolve(result);
        } catch (e) {
            return reject(e);
        }
    });
}

function getMonthList (year, pathData) {
    return new Promise(function (resolve, reject) {
        var result = {};
        try {
            pathData = pathData.filter(function (path) {
                var last = path.slice(0, path.lastIndexOf('/'));
                var month = path.slice(path.lastIndexOf('/') + 1);
                var curYear = last.slice(last.lastIndexOf('/') + 1);
                if (curYear === year) {
                    return month.length === 2 && (result[month] = path);
                }
            });
            return resolve(result);
        } catch (e) {
            return reject(e);
        }
    });
}

function getDayList (year, month, pathData) {
    return new Promise(function (resolve, reject) {
        var result = {};
        try {
            pathData = pathData.filter(function (path) {
                var arr = path.split('/');
                arr = arr.splice(arr.length - 3);
                var day = arr[2];
                var curMonth = arr[1];
                var curYear = arr[0];
                if (curYear === year && curMonth === month) {
                    return result[day] = path;
                }
            });
            return resolve(result);
        } catch (e) {
            return reject(e);
        }
    });
}


function getDescOrder (obj, cb) {
    return Object.keys(obj).sort(function () {return true;}).map(cb);
}

function generateFactory (pathData, mode, callback) {
    return getYearList(pathData).then(function (yearList) {
        return getDescOrder(yearList, function (year) {
            return mode === 'year' ? function () {

                //console.log('当前:', year);

            }.bind(this)(): getMonthList(year, pathData).then(function (monthList) {
                return getDescOrder(monthList, function (month) {
                    return mode === 'month' ? function () {

                        //console.log('当前:', year, month);

                    }.bind(this)(): getDayList(year, month, pathData).then(function (dayList) {
                        return getDescOrder(dayList, function (day) {

                            //console.log('当前:', year, month, dayList[day]);

                        });
                    });
                });
            });
        });
    });
}

function generateYearArchive (pathData, callback) {
    return generateFactory(pathData, 'year', callback);
}
function generateMonthArchive (pathData) {
    return generateFactory(pathData, 'month');
}
function generateDayArchive (pathData) {
    return generateFactory(pathData, 'day');
}


function generate (pathData) {
    generateYearArchive(pathData);
    generateMonthArchive(pathData);
    generateDayArchive(pathData);
    return 'generate archives';
}


function prepareDirs (pathData, postsRootDir, archiveDir) {
    return pathData.map(function (dirPath) {
        return dirPath.replace(postsRootDir, archiveDir);
    }).reduce(function (promiseFactory, data) {
        return promiseFactory.then(fs.mkdirs(data))
            .catch(function (e) {throw "创建文件夹失败:" + e;});
    }, Promise.resolve());
}

module.exports = {
    generate    : generate,
    prepareDirs : prepareDirs
};