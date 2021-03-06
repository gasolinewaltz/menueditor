<template>
  <div class="itemlist">
    <commit-changes v-show="changes"></commit-changes>
    <list-edit-widget></list-edit-widget>
    <ul v-dragula="dragModel" service="itemListService">
      <li v-for="(item,idx) in itemsInHeader" :key="item.list_order"
          :class="[item.alteration, {selected : isChecked(item.id)}]"
          :data-id="item.id"
          v-show="item.title !== ''">
        <span class="checkbox-group">
          <input type="checkbox" :id="idx" :name="idx" :value="item" v-model="itemCheckList">
          <label :for="idx"></label>
        </span>
        <router-link :to="{path: link+section+'/'+item.id }">{{item.title}}</router-link>
      </li>
    </ul>
    <item-edit :section="section" :item="(currentItem) ? currentItem : {}" v-show="isOpen"></item-edit>
  </div>
</template>

<script type="text/babel">
  import ItemEdit from './ItemEdit';
  import listEditWidget from './widgets/listEditBar';
  import commitChanges from './widgets/commitChanges';
    export default {
      components: {
        ItemEdit,
        listEditWidget,
        commitChanges
      },
      data(){
        return{
          itemCheckList : [],
          dragModel: [],
          currentItem: {},
          newItemTemplate: {
            id: -1,
            header: "",
            price: "",
            list_order: -1,
            title: "",
            descriptions: [
              {
                id: null,
                price: "",
                text: ""
              }
            ],
            newItem: true
          }
        }
      },
      computed:{

        siteSection(){
          return this.$route.params.subpage;
        },
        section(){
          return this.$route.params.section;
        },
        link(){
          return "/dashboard/"+this.urlFragment;
        },
        urlFragment(){
          return this.$route.params.page+'/'+this.$route.params.subpage+'/';
        },
        itemsInHeader(){
          var header = this.$route.params.section;
          if(header){
            return this.$lodash.sortBy(this.$lodash.groupBy(this.itemList, 'header')[header], item =>{
              return parseInt(item.list_order, 10);
            });
          }
        },

        isOpen(){
          return !this.$lodash.isEmpty(this.currentItem);
        },
        changes(){
          return this.$store.getters.isChanges;
        },
        itemList(){
          return this.$store.getters.getItemList;
        }

      },
      methods:{
        getItemList(page, subPage){
          this.$api.getItemList(page, subPage).then((response) => {
            response.data.forEach(item =>{
              item.descriptions = this.$lodash.sortBy(item.descriptions, (description) => {
                return parseInt(description.order, 10);
              });
            });
            this.$store.commit('setItemList', response.data);
            this.$store.commit('mergeItemsStagedForChange', this.$store.state.changesMade.items);
            this.getCurrentItem();
            EventBus.$emit('itemListLoad');
          });
        },
        getCurrentItem(){
          if(this.$route.params.item){
            this.currentItem = this.$store.getters.getItemFromId(this.$route.params.item);
          }else{
            this.currentItem = {};
          }
        },
        checkForItemList(){
          if(this.$route.params.subpage){
            var subPage = this.$route.params.subpage,
              page    = this.$route.params.page;
            this.getItemList(page, subPage);
          }
        },
        isChecked(id){
          return this.itemCheckList.filter((item) => {
            return item.id === id;
          }).length;
        },
        mergeItemsStagedForChange(){
          this.$store.commit('mergeItemsStagedForChange', this.$store.getters.getChangesList);
        }
      },
      watch:{
        '$route'(to, from){
          this.checkForItemList();
        }
      },
      created(){
        this.checkForItemList();

        EventBus.$on('itemSaveChanges', (item)=>{
          item.location = this.urlFragment;
          this.$store.commit('pushItem', {
            item,
            type: item.alteration
          });
          this.mergeItemsStagedForChange();
        });
        EventBus.$on('itemRemove', (item)=>{
          item.location = this.urlFragment;
          this.$store.commit('pushItem', {
            item,
            type: "delete"
          });
          this.mergeItemsStagedForChange();
          EventBus.$emit('itemClose');
        });
        EventBus.$on('selectAll', ()=>{
          this.itemCheckList = [];
          this.itemsInHeader.forEach((item) =>{
            this.itemCheckList.push(item);
          });
        });
        EventBus.$on('deSelectAll', ()=>{
          this.itemCheckList = [];
        });
        EventBus.$on('createNewItem', ()=>{
          let newItem =  this.$lodash.cloneDeep(this.newItemTemplate);
          newItem.header = this.section;
          newItem.id = Date.now()+"";
          newItem.location = this.urlFragment;
          newItem.list_order = Date.now()+"";
          this.itemList.push( newItem );
          this.$store.commit('pushItem', {
            item: newItem,
            type: "create"
          });
          this.mergeItemsStagedForChange();
          this.$nextTick(()=>{
            this.$router.replace(this.link+this.section+'/'+newItem.id);
          })
        });
        EventBus.$on('deleteSelectedItems', ()=>{
          this.itemCheckList.forEach(itemToDelete =>{
            console.log(itemToDelete.id);
            EventBus.$emit('itemRemove', itemToDelete);
          });
        });
        EventBus.$on('swapItems', ()=>{
          let loa = this.itemCheckList[0].list_order;
          this.itemCheckList[0].list_order = this.itemCheckList[1].list_order;
          this.itemCheckList[1].list_order = loa;
          EventBus.$emit('itemSaveChanges', this.itemCheckList[0]);
          EventBus.$emit('itemSaveChanges', this.itemCheckList[1]);
          this.itemCheckList = [];
        });

        let itemListService = this.$dragula.createService({
          name: 'itemListService'
        });

        itemListService.on({
          'itemListService:dropModel' : ({source, el}) =>{
            let childArray  = Array.prototype.slice.call(source.children, 0);
            let itemDropped = this.$store.getters.getItemFromId(el.dataset.id);
            childArray.forEach((el, idx) =>{
              let id = el.dataset.id;
              let item = this.$store.getters.getItemFromId(id);
              let list_order = parseInt(item.list_order, 10);
              idx+=1;
              if(list_order !== idx){
                item.list_order = idx;
                item.alteration = (item.id === itemDropped.id ) ?  'rearrange' : item.alteration;
                EventBus.$emit('itemSaveChanges', item);
              }

            });
          }
        })


      }
    }
</script>

<style lang="scss">
  @import '../assets/styles/itemList.scss';
</style>
