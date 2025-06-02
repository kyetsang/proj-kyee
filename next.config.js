/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用 SWC 压缩以避免冲突
  swcMinify: false,
  // 添加跨域支持
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 