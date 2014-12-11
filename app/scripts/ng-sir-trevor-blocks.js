define([
    'angular',
    'ng-sir-trevor'
], function(angular) {
    'use strict';
    angular
    .module('SirTrevorBlocks', [])
        .config(['SirTrevorProvider', function(SirTrevor) {
            // Add toMeta method to all blocks.
            SirTrevor.Block.prototype.toMeta = function(){return;};
            SirTrevor.Blocks.Quote =  SirTrevor.Block.extend({

              type: "quote",
          
              title: function(){ return i18n.t('blocks:quote:title'); },
          
              icon_name: 'quote',
          
              editorHTML: function() {
                var template = _.template([
                  '<blockquote class="st-required st-text-block" contenteditable="true"></blockquote>',
                  '<label class="st-input-label"> <%= i18n.t("blocks:quote:credit_field") %></label>',
                  '<input maxlength="140" name="cite" placeholder="<%= i18n.t("blocks:quote:credit_field") %>"',
                  ' class="st-input-string st-required js-cite-input" type="text" />'
                ].join("\n"));
                return template(this);
              },
          
              loadData: function(data){
                this.getTextBlock().html(SirTrevor.toHTML(data.text, this.type));
                this.$('.js-cite-input').val(data.cite);
              },
          
              toMarkdown: function(markdown) {
                return markdown.replace(/^(.+)$/mg,"> $1");
              },
              toHTML: function(html) {
                return [
                    '<blockquote><p>',
                    this.getTextBlock().html(),
                    '</p><ul><li>',
                    this.$('.js-cite-input').val(),
                    '</li></ul></blockquote>'].join('');
              },
              toMeta: function() {
                return {
                    quote: this.getTextBlock().html(),
                    credit: this.$('.js-cite-input').val()
                }
              }
            });

            // Add toHTML to existing Text Block.
            SirTrevor.Blocks.Text.prototype.toHTML = function() {
                return this.getTextBlock().html();
            };

            var Strikethrough = SirTrevor.Formatter.extend({
              title: "strikethrough",
              iconName: "strikethrough",
              cmd: "strikeThrough",
              text: "S"
              });
            SirTrevor.Formatters.Strikethrough = new Strikethrough();

            var OrderedList = SirTrevor.Formatter.extend({
              title: "orderedlist",
              iconName: "link",
              cmd: "insertOrderedList",
              text: "orderedlist"
              });
            SirTrevor.Formatters.NumberedList = new OrderedList();

            var UnorderedList = SirTrevor.Formatter.extend({
              title: "unorderedlist",
              iconName: "link",
              cmd: "insertUnorderedList",
              text: "unorderedlist"
              });
            SirTrevor.Formatters.BulletList = new UnorderedList();

        }]);
});
