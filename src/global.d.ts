type CommonObject = {
  // 如果后续any很多，考虑在tsconfig.json中忽略这条规则
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;
};

type Key = number | string;

type Option = {
  label: string;
  value: Key;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;
};
type OptionMap = {
  [prop: string]: Option;
};

// 表格数据类型
type TableData<T extends CommonObject = CommonObject> = {
  dataSource: T[];
  total: number;
};

// 页码信息
type PageInfo = {
  page: number;
  pageSize: number;
};
