export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/create/index',
    'pages/cars/index',
    'pages/mine/index',
    'pages/script-detail/index',
    'pages/car-detail/index',
    'pages/invite/index',
    'pages/admin/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1A1A2E',
    navigationBarTitleText: '熟客约本',
    navigationBarTextStyle: 'white',
    backgroundColor: '#1A1A2E'
  },
  tabBar: {
    color: '#8686A8',
    selectedColor: '#7B4BFF',
    backgroundColor: '#252542',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/create/index',
        text: '发起'
      },
      {
        pagePath: 'pages/cars/index',
        text: '车局'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
