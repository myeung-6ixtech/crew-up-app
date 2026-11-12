const { withPodfile } = require('expo/config-plugins');

const MARKER = 'crewup-arm64-node';

/**
 * EAS image macos-tahoe-26.5-xcode-26.6 pins NODE_BINARY to nvm's Node.
 * Xcode's React-Core-prebuilt script then dies with
 * "cannot execute binary file" because that binary is not arm64.
 * Rewrite .xcode.env.local after pod install to an arm64 Node.
 */
const SNIPPET = `
    # ${MARKER}
    node_candidates = ['/opt/homebrew/bin/node', '/usr/local/bin/node']
    node_candidates << \`command -v node\`.strip
    node_bin = node_candidates.find do |path|
      !path.to_s.empty? && File.executable?(path) && system('arch', '-arm64', path, '-e', 'process.exit(0)', out: File::NULL, err: File::NULL)
    end
    unless node_bin
      system('brew', 'install', 'node')
      node_bin = '/opt/homebrew/bin/node' if File.executable?('/opt/homebrew/bin/node')
    end
    if node_bin
      File.write(File.join(__dir__, '.xcode.env.local'), "export NODE_BINARY=#{node_bin}\\nunset arch\\n")
      Pod::UI.puts "[crew-up] Xcode NODE_BINARY=#{node_bin}"
    end
`;

function withIosNodeBinary(config) {
  return withPodfile(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) return config;

    const start = config.modResults.contents.indexOf('react_native_post_install(');
    if (start === -1) {
      throw new Error('Podfile has no react_native_post_install call; cannot pin an arm64 Node for Xcode');
    }

    const end = config.modResults.contents.indexOf('\n  end', start);
    if (end === -1) {
      throw new Error('Podfile post_install block not found');
    }

    config.modResults.contents =
      config.modResults.contents.slice(0, end) + SNIPPET + config.modResults.contents.slice(end);
    return config;
  });
}

module.exports = withIosNodeBinary;
