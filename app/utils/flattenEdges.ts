export const flattenEdges = <T extends { edges: any[] }>(data: T) => {
  return data.edges.map((edge) => edge.node);
};
