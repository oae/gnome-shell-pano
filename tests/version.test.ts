import GLib from '@girs/glib-2.0';
import { isGnomeVersion } from '@pano/utils/compatibility';

describe('version', () => {
  it('if we run in teh CI, the expected version should match', async () => {
    const environment = GLib.get_environ();

    const is_ci = GLib.environ_getenv(environment, 'CI');
    if (is_ci !== null) {
      const expect_gnome_version = GLib.environ_getenv(environment, 'CI_EXPECT_GNOME_VERSION');

      if (expect_gnome_version === null) {
        throw new Error(
          "Expected the environment variable 'CI_EXPECT_GNOME_VERSION' to be set, when running in the CI",
        );
      }

      const expectedVersion = parseInt(expect_gnome_version);

      if (isNaN(expectedVersion)) {
        throw new Error(
          "Expected the environment variable 'CI_EXPECT_GNOME_VERSION' to be set to a number, when running in the CI",
        );
      }

      expect(isGnomeVersion(expectedVersion)).toEqual(true);
    }
  });
});
