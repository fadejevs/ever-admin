// @third-party
import { FormattedMessage } from 'react-intl';

// @project
import { AuthRole } from '@/enum';

// @types

/***************************  MENU ITEMS - APPLICATIONS  ***************************/

const manage = {
  id: 'group-manage',
  title: <FormattedMessage id="manage" />,
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      // title: <FormattedMessage id="Dashboard" />,
      title: <FormattedMessage id="Analytics" />,
      type: 'item',
      url: '/dashboard/analytics/metrics',
      // icon: 'IconLayoutGrid'
      icon: 'IconStack2'
    }
    // {
    //   id: 'metrics',
    //   title: <FormattedMessage id="Metrics" />,
    //   type: 'item',
    //   url: '/dashboard/metrics',
    //   icon: 'IconChartHistogram'
    // }
  ]
};

export default manage;
