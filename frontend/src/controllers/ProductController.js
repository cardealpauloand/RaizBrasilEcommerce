import ProductModel from '../models/ProductModel'

export default {
  list(){ return ProductModel.fetchAll() },
  categories(){ return ProductModel.categories() },
  search(q){ return ProductModel.search(q) },
  get(id){ return ProductModel.findById(id) }
}
