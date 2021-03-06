<template>
  <div class="item-edit-modal" @click="close">
    <div class="item-editor" @click.stop>
      <item-edit-bar></item-edit-bar>
      <table class="top-section">
        <tr class="title">
          <th>Item Title: </th>
          <item-property itemkey="title" colspan="2">
            <span slot="item" v-show="localItem.title">{{localItem.title}}</span>
            <span slot="item" v-show="!localItem.title">(add description)</span>
          </item-property>
        </tr>
        <tr class="price">
          <th>Price: </th>
          <item-property itemkey="price" colspan="2">
            <template slot="item">
              <span v-show="localItem.price">${{localItem.price}}</span>
              <span v-show="!localItem.price">(add price)</span>
            </template>
          </item-property>
        </tr>
        <tr class="header">
          <th>Section</th>
          <th>
            <select @change="subPageLookup" v-model="currentSubPage">
              <option v-for="subPageList in subPages" :selected="(subPageList === currentSubPage)" :value="subPageList">{{subPageList}}</option>
            </select>
          </th>
          <th>
            <select v-model="localItem.header" >
              <option v-for="header in currentHeaders" :selected="(header === item.header)" :value="header">{{header}}</option>
            </select>
          </th>
        </tr>
        </table>
       <hr>
        <table class="descriptions">
          <tr><th colspan="3">Item Descriptions</th></tr>
          <tbody class="drag-container" v-dragula="localItem.descriptions" service="descriptions">
            <tr
              v-for="(description, idx) in localItem.descriptions"
              v-show="description.text !== ''"
              :data-id="description.id"
            >
              <th class="delete-description">
                <button class="modify-description" @click.prevent="removeDescription($event, idx)">
                  <i class="fa fa-minus-circle" aria-hidden="true"></i>
                </button>
              </th>
              <item-property
                itemkey="descriptions"
                :itemidx="idx"
                itemsubkey="text"
              >
                <span slot="item">{{description.text}}</span>
              </item-property>
              <item-property
                itemkey="descriptions"
                :itemidx="idx"
                itemsubkey="price"
              >
                <template slot="item">
                  <span v-show="description.price">${{description.price}}</span>
                  <span v-show="!description.price">(add price)</span>
                </template>
              </item-property>
            </tr>
          </tbody>

          <tr>
            <th class="add-description">
              <button class="modify-description" v-show="isAddDescription" @click.prevent="pushNewDescription">
                <i class="fa fa-plus-circle" aria-hidden="true"></i>
              </button>
            </th>
            <th >
              <span v-show="!isAddDescription" @click="addDescription">(add description)</span>
              <input  class="firstDescriptionField"
                      @blur="blurAddDescription"
                      @keydown.enter="pushNewDescription"
                      v-show="isAddDescription"
                      v-model="newDescription.text">
            </th>
            <th>
              <span v-show="!isAddDescription" @click="addDescription">(add price)</span>
              <input
                @keydown.enter="pushNewDescription"
                v-show="isAddDescription"
                v-model="newDescription.price">
            </th>
            <th></th>
          </tr>
      </table>

    </div>
  </div>
</template>
<script type="text/babel">
    import itemProperty from './itemProperty';
    import itemEditBar from './widgets/itemEditBar'
    export default {
      props: ['item'],
      components: {
        itemProperty, itemEditBar
      },
      data(){
        return{
          isAddDescription: false,
          newDescription:{
            text : '',
            price : '',
            order : ''
          },
          localItem : {},
          propertiesNotCommitted: false,
          currentSubPage : "",
          currentHeaders : {}
        }
      },
      computed:{

        headers(){
          return this.$parent.itemListHeaders;
        },
        section(){
          return this.$route.params.section;
        },
        subPage(){
          return this.$route.params.subpage
        },
        subPages(){
          return this.$store.getters.getSubPages;
        },
        hasChanged(){
          return !this.$lodash.isEqual(this.localItem, this.$props.item);
        }
      },
      methods:{
        pushNewDescription(key){
          if(!this.$data.newDescription.text){
            console.warn('A Sub Item Needs a Description');
            return
          }
          let propToPush = this.$lodash.extend({}, this.$data.newDescription);
          propToPush.order = this.localItem.descriptions.length+"";
          propToPush.id = Date.now()+"";
          this.localItem.descriptions.push(propToPush);
          this.closeAddDescription();
          this.addDescription();
        },
        addDescription(){
          this.$data.isAddDescription = true;
          this.$nextTick(()=>{
            this.$el.querySelector('.firstDescriptionField').focus();
          })
        },
        closeAddDescription(){
          this.$data.newDescription.text = "";
          this.$data.newDescription.price = "";
          this.$data.isAddDescription = false;
        },
        removeDescription(evt, idx){
          this.localItem.descriptions[idx].text = "";
        },
        blurAddDescription(evt){
          if(evt.target.value === ""){
            this.closeAddDescription();
          }
        },
        setLocalItem(item){
          this.localItem = this.$lodash.cloneDeep(item);

          this.currentHeaders = this.$store.getters.getItemListHeaders;
          this.currentSubPage = this.subPage;
        },
        subPageLookup(evt){
          let page = this.$route.params.page;
          return this.$api.getItemList(page, evt.target.value)
                .then((response) =>{
                  let newHeaders = this.headersInNewSection(response.data);
                  this.$set(this.$data, 'currentHeaders', newHeaders );
                });
        },
        headersInNewSection(itemList){
          return this.$lodash.uniq( this.$lodash.map(itemList, (item) => { return item.header }))
        },
        close(){
          let itemInStore = this.$store.getters.getItemFromId(this.localItem.id);
          if( this.localItem.newItem &&
              itemInStore.title === '' &&
              itemInStore.alteration !== 'delete'){

            alert("New item has to have a title")
          }else{
            this.$router.push({name: 'section-view'})
          }
        }
      },
      watch:{
        '$props.item'(){
          this.setLocalItem(this.$props.item);
        }

      },
      created(){
        this.setLocalItem(this.$props.item);

        this.$watch('localItem', (oldVal, newVal) => {
          if(this.hasChanged){
            EventBus.$emit('propsNotCommitted');
          }
        }, {deep: true});

        EventBus.$on('itemUndoChanges', ()=>{
          this.setLocalItem(this.$props.item);
        });
        EventBus.$on('itemClose', ()=>{
          this.close();
        });

        let descriptionService = this.$dragula.createService({
          name: 'descriptions'
        });

        descriptionService.on({
          'descriptions:dropModel' : ({source}) =>{
            //on drop, reorder list
            Array.prototype.slice.call(source.children, 0).forEach((el, idx) =>{
              let id = el.dataset.id;
              this.$lodash.find(this.localItem.descriptions, {'id' : id}).order = idx;
            });
          }
        });
      }
    }
</script>

<style lang="scss">
  @import "../assets/styles/itemEdit.scss";
</style>
