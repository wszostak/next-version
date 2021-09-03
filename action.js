const semver = require('semver');
const { getLatestTag } = require('./git-commands');

/**
 * @param prefix
 * @param versioning
 * @param force
 * @param tagExtractor
 * @returns {string|*}
 */
module.exports = function action({ prefix = 'v', versioning = 'semver', force, preReleaseSuffix = '', level = 'patch' }, tagExtractor = getLatestTag) {

  const latestTag = tagExtractor(prefix);
  const PRERELEASE_LEVEL_NAME = 'prerelease';

  if (force) return { 'currentTag': latestTag || '', 'nextTag': prefix + force, 'nextVersion': force };

  if (!['semver', 'single-number'].includes(versioning)) {
    throw new Error(`unknown versioning '${versioning}'`);
  }

  if (!['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'].includes(level)) {
    throw new Error(`Invalid level name: ${level}`);
  }

  if (level === PRERELEASE_LEVEL_NAME && preReleaseSuffix === '') {
    throw new Error(`There is no pre release suffix for level: ${level}`);
  }

  if (latestTag === null) {
    switch (versioning) {
      case 'semver': {
        const initVersion = '0.0.0';
        return {
          currentTag: '',
          nextTag: `${prefix}${semver.inc(initVersion, level, preReleaseSuffix)}`,
          nextVersion: semver.inc(initVersion, level, preReleaseSuffix)
        };
      }
      case 'single-number': {
        let suffix = '';
        if (level === PRERELEASE_LEVEL_NAME) {
          suffix = `-${preReleaseSuffix}.0`;
        }
        return {
          currentTag: '',
          nextTag: `${prefix}1${suffix}`,
          nextVersion: `1${suffix}`
        };
      }
    }
  }
  if (!latestTag.startsWith(prefix)) {
    throw new Error(`expecting provided tag ${latestTag} to start with ${prefix}`);
  }
  const version = latestTag.slice(prefix.length);

  switch (versioning) {
    case 'semver': {
      if (!semver.valid(version)) throw new Error(`version ${version} not a valid semver string`);
        return {
          currentTag: latestTag,
          nextTag: `${prefix}${semver.inc(version, level, preReleaseSuffix)}`,
          nextVersion: semver.inc(version, level, preReleaseSuffix)
        };
    }
    case 'single-number': {
      const isPreRelease = version.includes('-' + preReleaseSuffix);

      if (isPreRelease && level !== PRERELEASE_LEVEL_NAME) {
        const versionInt = parseInt(version, 10);
        if (isNaN(versionInt)) throw new Error(`version ${version} not a valid number`);
        return {
          currentTag: latestTag,
          nextTag: `${prefix}${versionInt}`,
          nextVersion: `${versionInt}`
        };
      }

      const [singleNumberVersion, suffix] = version.split(`-${preReleaseSuffix}.`, 2);
      const nextPreReleaseVersion = suffix ? parseInt(suffix,10) + 1 : 0;

      if (isPreRelease && level === PRERELEASE_LEVEL_NAME) {
        const nextVersion2 = `${singleNumberVersion}-${preReleaseSuffix}.${nextPreReleaseVersion}`;

        return {
          currentTag: latestTag,
          nextTag: `${prefix}${nextVersion2}`,
          nextVersion: `${nextVersion2}`
        };
      }

      if (!isPreRelease && level !== PRERELEASE_LEVEL_NAME) {
        const nextVersion3 = `${parseInt(singleNumberVersion, 10) + 1}`;

        return {
          currentTag: latestTag,
          nextTag: `${prefix}${nextVersion3}`,
          nextVersion: `${nextVersion3}`
        };
      }

      const nextVersion = `${parseInt(singleNumberVersion, 10) + 1}-${preReleaseSuffix}.${nextPreReleaseVersion}`;

      return {
        currentTag: latestTag,
        nextTag: `${prefix}${nextVersion}`,
        nextVersion: nextVersion
      };
    }
  }
};